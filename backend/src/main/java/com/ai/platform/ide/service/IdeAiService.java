package com.ai.platform.ide.service;

import com.ai.platform.ai.AiModel;
import com.ai.platform.ai.ModelRouterService;
import com.ai.platform.common.exception.ApiException;
import com.ai.platform.ide.dto.*;
import com.ai.platform.ide.entity.GitConnection;
import com.ai.platform.ide.entity.IdeAgentRun;
import com.ai.platform.ide.entity.ProjectChunk;
import com.ai.platform.ide.entity.ProjectIndex;
import com.ai.platform.ide.repository.GitConnectionRepository;
import com.ai.platform.ide.repository.IdeAgentRunRepository;
import com.ai.platform.project.entity.Project;
import com.ai.platform.project.service.ProjectService;
import com.ai.platform.usage.service.UsageTrackingService;
import com.ai.platform.user.entity.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class IdeAiService {

    private static final Pattern JSON_ARRAY = Pattern.compile("\\[\\s*\\{[\\s\\S]*}\\s*]", Pattern.DOTALL);

    private final ProjectService projectService;
    private final IdeContextService ideContextService;
    private final ProjectIndexService projectIndexService;
    private final ModelRouterService modelRouterService;
    private final UsageTrackingService usageTrackingService;
    private final IdeAgentRunRepository ideAgentRunRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public IdeChatResponse chat(User user, IdeChatRequest request) throws IOException {
        Project project = projectService.getOwned(user, request.getProjectId());
        String context = ideContextService.buildContext(user, project, request.getFileId(),
                request.getContextScope(), request.getMessage());
        String response = callAi(user, request.getModel(), """
                You are an expert software engineer in an online IDE.
                Answer in Vietnamese when the user writes in Vietnamese.
                Reply in plain text only — no markdown, no code fences, no headers, no bullet syntax.
                Context scope: %s

                %s

                User question:
                %s
                """.formatted(request.getContextScope(), context, request.getMessage()));
        return IdeChatResponse.builder().response(response).build();
    }

    @Transactional
    public IdeChatResponse inline(User user, IdeInlineRequest request) throws IOException {
        Project project = projectService.getOwned(user, request.getProjectId());
        String fileCtx = ideContextService.buildContext(user, project, request.getFileId(), "FILE", null);
        String action = request.getAction().toUpperCase();
        String rangeHint = "";
        if (request.getStartLine() != null && request.getEndLine() != null) {
            rangeHint = "ONLY modify lines %d-%d. Return replacement for that range only.\n"
                    .formatted(request.getStartLine(), request.getEndLine());
        }
        String instruction = switch (action) {
            case "REFACTOR" -> rangeHint + "Refactor the selected code. Return ONLY the improved code for the selection, no explanation.";
            case "OPTIMIZE" -> rangeHint + "Optimize the selected code. Return ONLY the optimized code for the selection.";
            case "TEST" -> "Generate unit tests for the selected code. Return ONLY test code.";
            default -> "Explain the selected code clearly in Vietnamese. Plain text only, no markdown.";
        };
        String pathNote = request.getSelectedFilePath() != null
                ? "File: " + request.getSelectedFilePath() + "\n" : "";
        String response = callAi(user, request.getModel(), """
                %s
                %s
                File context:
                %s

                Selected code:
                ```
                %s
                ```
                """.formatted(instruction, pathNote, fileCtx, request.getSelectedCode()));
        return IdeChatResponse.builder().response(response).build();
    }

    @Transactional
    public IdeChatResponse generate(User user, IdePromptRequest request) throws IOException {
        Project project = projectService.getOwned(user, request.getProjectId());
        String context = ideContextService.buildContext(user, project, request.getFileId(), "PROJECT", request.getPrompt());
        String response = callAi(user, request.getModel(), """
                Generate source code for the following request.
                Return complete files with path comments like // path: src/...
                Explain briefly in plain text (no markdown).

                Project context:
                %s

                Request: %s
                """.formatted(context, request.getPrompt()));
        return IdeChatResponse.builder().response(response).build();
    }

    @Transactional
    public IdeChatResponse refactor(User user, IdePromptRequest request) throws IOException {
        Project project = projectService.getOwned(user, request.getProjectId());
        String context = ideContextService.buildContext(user, project, request.getFileId(), "RAG", request.getPrompt());
        String response = callAi(user, request.getModel(), """
                Refactor the codebase according to the request.
                Explain changes in plain text (no markdown).

                %s

                Refactor request: %s
                """.formatted(context, request.getPrompt()));
        return IdeChatResponse.builder().response(response).build();
    }

    @Transactional
    public IdeMultiEditResponse multiEdit(User user, IdePromptRequest request) throws IOException {
        Project project = projectService.getOwned(user, request.getProjectId());
        String context = ideContextService.buildContext(user, project, null, "RAG", request.getPrompt());
        String raw = callAi(user, request.getModel(), """
                Apply changes across multiple files for this request.
                Return ONLY a JSON array (no markdown) with objects:
                [{"path":"relative/path","content":"full file content","create":true}]

                Project context:
                %s

                Request: %s
                """.formatted(context, request.getPrompt()));

        List<IdeFileEditDto> edits = parseEdits(raw);
        return IdeMultiEditResponse.builder()
                .summary("AI đề xuất " + edits.size() + " thay đổi file.")
                .edits(edits)
                .build();
    }

    @Transactional
    public IdeMultiEditResponse autoFix(User user, IdeChatRequest request) throws IOException {
        Project project = projectService.getOwned(user, request.getProjectId());
        String context = ideContextService.buildContext(user, project, request.getFileId(),
                request.getContextScope(), request.getMessage());
        String instruction = request.getMessage() != null && !request.getMessage().isBlank()
                ? request.getMessage()
                : "Tự động phát hiện và sửa bug, lỗi logic, security và code smell.";

        boolean hasSelection = request.getStartLine() != null && request.getEndLine() != null
                && request.getSelectedCode() != null && !request.getSelectedCode().isBlank();
        String filePath = request.getSelectedFilePath() != null ? request.getSelectedFilePath() : "active-file";

        String raw;
        if (hasSelection) {
            raw = callAi(user, request.getModel(), """
                    You are an auto-fix engine in an IDE.
                    CRITICAL: User selected ONLY lines %d-%d in file "%s".
                    Fix ONLY that selected code. Do NOT rewrite the entire file.
                    User instruction: %s

                    Return ONLY a JSON array (no markdown) with exactly one object:
                    [{"path":"%s","content":"corrected code for the selection ONLY — same number of lines as selected unless user asks otherwise","partial":true,"create":false}]
                    Do NOT include startLine/endLine in JSON. Do NOT include code outside the selection (no extra fields, no closing brace).

                    Selected code to fix:
                    ```
                    %s
                    ```

                    Surrounding file context (reference only — do not return full file):
                    %s
                    """.formatted(
                    request.getStartLine(), request.getEndLine(), filePath, instruction,
                    filePath,
                    request.getSelectedCode(), context));
        } else {
            raw = callAi(user, request.getModel(), """
                    You are an auto-fix engine in an IDE.
                    Analyze the codebase context and fix issues: bugs, null safety, security, performance, style.
                    User instruction: %s

                    Return ONLY a JSON array (no markdown) with objects:
                    [{"path":"relative/path","content":"full corrected file content","create":false}]

                    Only include files that actually need changes. Use exact relative paths from the project.
                    If a file is new, set "create": true.

                    Context:
                    %s
                    """.formatted(instruction, context));
        }

        List<IdeFileEditDto> edits = parseEdits(raw);
        String summary = edits.isEmpty()
                ? (hasSelection ? "Không phát hiện vấn đề trong đoạn đã chọn." : "Không phát hiện vấn đề cần sửa trong phạm vi context.")
                : (hasSelection ? "Đã sửa đoạn dòng " + request.getStartLine() + "-" + request.getEndLine() + " trong " + filePath
                    : "Tự sửa " + edits.size() + " file: " + edits.stream().map(IdeFileEditDto::getPath).limit(5).toList());
        return IdeMultiEditResponse.builder().summary(summary).edits(edits).build();
    }

    @Transactional
    public IdeSearchResponse search(User user, Long projectId, String query, AiModel model) throws IOException {
        projectService.getOwned(user, projectId);
        List<ProjectIndex> symbols = projectIndexService.searchSymbols(projectId, query);
        List<ProjectChunk> chunks = projectIndexService.searchChunks(projectId, query);

        List<IdeSearchResultDto> results = new ArrayList<>();
        for (ProjectIndex s : symbols.stream().limit(15).toList()) {
            results.add(IdeSearchResultDto.builder()
                    .filePath(s.getFilePath())
                    .lineNumber(s.getLineNumber())
                    .symbolName(s.getSymbolName())
                    .symbolType(s.getSymbolType())
                    .snippet(s.getSignature())
                    .score(1.0)
                    .build());
        }
        for (ProjectChunk c : chunks.stream().limit(10).toList()) {
            if (results.stream().anyMatch(r -> r.getFilePath().equals(c.getFilePath()))) continue;
            results.add(IdeSearchResultDto.builder()
                    .filePath(c.getFilePath())
                    .lineNumber(1)
                    .symbolName("chunk-" + c.getChunkIndex())
                    .symbolType("chunk")
                    .snippet(c.getContent().substring(0, Math.min(200, c.getContent().length())))
                    .score(0.8)
                    .build());
        }

        String aiSummary = callAi(user, model, """
                User searches codebase: "%s"
                Found %d results. Summarize where the answer likely is (file + line). Vietnamese. Plain text only.
                Results: %s
                """.formatted(query, results.size(),
                results.stream().limit(5).map(r -> r.getFilePath() + ":" + r.getLineNumber()).toList()));

        return IdeSearchResponse.builder().results(results).aiSummary(aiSummary).build();
    }

    @Transactional
    public IdeChatResponse review(User user, IdePromptRequest request) throws IOException {
        Project project = projectService.getOwned(user, request.getProjectId());
        String context = ideContextService.buildContext(user, project, request.getFileId(), "FILE", null);
        String response = callAi(user, request.getModel(), """
                Perform AI code review. Analyze: bugs, security, performance, best practices.
                Answer in Vietnamese. Plain text only, no markdown.

                %s
                """.formatted(context));
        return IdeChatResponse.builder().response(response).build();
    }

    @Transactional
    public IdeChatResponse architecture(User user, Long projectId, AiModel model) throws IOException {
        Project project = projectService.getOwned(user, projectId);
        String context = ideContextService.buildContext(user, project, null, "PROJECT", "architecture");
        String response = callAi(user, model, """
                Generate architecture documentation from this codebase:
                1. System Design overview
                2. ERD description (entities & relationships)
                3. API Flow
                4. Sequence flow for main features
                Vietnamese. Plain text only, no markdown or mermaid.

                %s
                """.formatted(context));
        return IdeChatResponse.builder().response(response).build();
    }

    @Transactional
    public IdeAgentResponse agent(User user, IdePromptRequest request) throws IOException {
        Project project = projectService.getOwned(user, request.getProjectId());
        List<IdeAgentStepDto> steps = new ArrayList<>();

        steps.add(step(1, "Phân tích project", "Đang index và tìm file liên quan..."));
        projectIndexService.indexProject(user, project.getId());
        String context = ideContextService.buildContext(user, project, null, "RAG", request.getPrompt());

        steps.add(step(2, "Lập kế hoạch", "AI thiết kế các bước thực hiện..."));
        String plan = callAi(user, request.getModel(), """
                You are an AI coding agent. Create a step-by-step plan for:
                %s
                Plain text only, no markdown.

                Project context (summary):
                %s
                """.formatted(request.getPrompt(), context.substring(0, Math.min(8000, context.length()))));
        steps.add(step(3, "Kế hoạch", plan));

        steps.add(step(4, "Sinh code", "AI tạo thay đổi file..."));
        IdeMultiEditResponse edits = multiEdit(user, request);
        steps.add(step(5, "Hoàn tất", edits.getSummary()));

        String stepsJson = objectMapper.writeValueAsString(steps);
        IdeAgentRun run = ideAgentRunRepository.save(IdeAgentRun.builder()
                .project(project)
                .user(user)
                .prompt(request.getPrompt())
                .status("COMPLETED")
                .stepsJson(stepsJson)
                .result(plan)
                .build());

        return IdeAgentResponse.builder()
                .runId(run.getId())
                .steps(steps)
                .result(plan)
                .edits(edits.getEdits())
                .build();
    }

    @Transactional
    public IdeChatResponse commitMessage(User user, Long projectId, String changesSummary, AiModel model) throws IOException {
        projectService.getOwned(user, projectId);
        String response = callAi(user, model, """
                Generate a conventional commit message (e.g. feat(scope): description) for:
                %s
                Return ONLY the commit message line.
                """.formatted(changesSummary != null ? changesSummary : "code changes in IDE"));
        return IdeChatResponse.builder().response(response.trim()).build();
    }

    private String callAi(User user, AiModel model, String userPrompt) {
        AiModel resolved = model != null ? model : AiModel.GROQ_LLAMA_70B;
        Prompt prompt = new Prompt(List.of(
                new SystemMessage("You are an expert AI coding assistant. Always respond in plain text. Never use markdown formatting."),
                new UserMessage(userPrompt)
        ));
        String response = modelRouterService.callContent(resolved, prompt);
        if (response == null) response = "Không nhận được phản hồi từ AI.";
        usageTrackingService.recordUsage(user, null, resolved, userPrompt, response);
        return response;
    }

    private IdeAgentStepDto step(int n, String title, String detail) {
        return IdeAgentStepDto.builder().step(n).title(title).detail(detail).build();
    }

    private List<IdeFileEditDto> parseEdits(String raw) {
        try {
            Matcher m = JSON_ARRAY.matcher(raw);
            if (m.find()) {
                return objectMapper.readValue(m.group(), new TypeReference<List<IdeFileEditDto>>() {});
            }
        } catch (Exception ignored) {}
        return List.of();
    }
}
