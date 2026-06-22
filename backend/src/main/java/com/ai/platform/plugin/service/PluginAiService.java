package com.ai.platform.plugin.service;

import com.ai.platform.ai.AiCompletionResult;
import com.ai.platform.ai.AiModel;
import com.ai.platform.ai.ModelRouterService;
import com.ai.platform.knowledge.service.KnowledgeContextService;
import com.ai.platform.plugin.dto.*;
import com.ai.platform.plugin.entity.PluginEditorType;
import com.ai.platform.plugin.repository.PluginUsageRepository;
import com.ai.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PluginAiService {

    private final ModelRouterService modelRouterService;
    private final PluginContextBuilder contextBuilder;
    private final PluginSessionService sessionService;
    private final PluginUsageTracker usageTracker;
    private final KnowledgeContextService knowledgeContextService;
    private final PluginUsageRepository usageRepository;
    private final PluginMessageBuilder messageBuilder;

    @Transactional
    public PluginChatResponse chat(User user, PluginChatRequest request) {
        touchContext(user, request.getContext());
        boolean hasMessage = request.getMessage() != null && !request.getMessage().isBlank();
        boolean hasAttachments = request.getAttachments() != null && !request.getAttachments().isEmpty();
        if (!hasMessage && !hasAttachments) {
            return PluginChatResponse.builder().answer("Vui lòng nhập câu hỏi hoặc đính kèm file/code.").build();
        }
        AiModel model = request.getModel() != null ? request.getModel() : AiModel.GROQ_LLAMA_70B;

        if (request.getKnowledgeBaseId() != null) {
            var rag = knowledgeContextService.buildContext(user, request.getKnowledgeBaseId(), request.getMessage());
            AiCompletionResult result = complete(model, rag.systemPrompt(), rag.userContext());
            usageTracker.record(user, editorType(request.getContext()), "knowledge-chat", model,
                    request.getMessage(), result.text(), result.usage());
            String full = result.text();
            if (!rag.sources().isEmpty()) {
                full += knowledgeContextService.formatSourcesFooter(rag.sources());
            }
            return PluginChatResponse.builder().answer(full).sources(rag.sources()).build();
        }

        String ctx = contextBuilder.buildContextBlock(request.getContext());
        String system = """
                You are an expert AI coding assistant inside an IDE plugin (like Cursor).
                Answer in Vietnamese when the user writes in Vietnamese.
                Use markdown: **bold** for important terms, `inline code` for identifiers,
                and ```language code blocks``` for multi-line code.
                Be concise and fluent. Use the project context and attachments when relevant.
                """;
        String question = hasMessage ? request.getMessage() : "Phân tích các file/code đính kèm.";
        String userMsg = messageBuilder.buildUserMessage(
                ctx.isBlank() ? question : ctx + "\n\n" + question,
                request.getAttachments());
        var images = messageBuilder.extractImages(request.getAttachments()).stream()
                .map(i -> new ModelRouterService.ImageAttachment(i.name(), i.mimeType(), i.base64()))
                .toList();
        AiCompletionResult result = images.isEmpty()
                ? complete(model, system, userMsg)
                : completeWithImages(model, system, userMsg, images);
        usageTracker.record(user, editorType(request.getContext()), "chat", model, userMsg, result.text(), result.usage());
        return PluginChatResponse.builder().answer(result.text()).build();
    }

    @Transactional
    public PluginInlineResponse inline(User user, PluginInlineRequest request) {
        touchContext(user, request.getContext());
        AiModel model = request.getModel() != null ? request.getModel() : AiModel.GROQ_LLAMA_70B;
        String code = request.getCode();
        if ((code == null || code.isBlank())) {
            var snippet = messageBuilder.firstSnippet(request.getAttachments());
            if (snippet != null) {
                code = snippet.getContent();
            } else if (request.getContext() != null && request.getContext().getSelection() != null) {
                code = request.getContext().getSelection().getText();
            }
        }
        String action = request.getAction() != null ? request.getAction().toUpperCase() : "EXPLAIN";
        String ctx = contextBuilder.buildContextBlock(request.getContext());
        String instruction = request.getInstruction() != null ? request.getInstruction().trim() : "";
        boolean isEdit = "EDIT".equals(action);
        boolean fullFile = code != null && code.length() > 800;
        String system;
        if (isEdit && !instruction.isBlank()) {
            system = fullFile
                    ? """
                    You are an expert programmer editing a file in an IDE.
                    Apply the instruction to the ENTIRE file content provided.
                    Return the COMPLETE updated file from start to end.
                    Do NOT return only a fragment or diff. No markdown fences. No explanation.
                    """
                    : """
                    You are an expert programmer editing code in an IDE.
                    Apply the instruction and return ONLY the complete modified code section.
                    No markdown fences. No explanation.
                    """;
        } else {
            system = "You are an expert programmer. Return only the result code or explanation as requested. No markdown fences unless asked.";
        }
        String userMsg;
        if ("EDIT".equals(action) && !instruction.isBlank()) {
            userMsg = """
                    Action: EDIT
                    Instruction: %s
                    %s
                    Code:
                    ```
                    %s
                    ```
                    """.formatted(instruction, ctx, code != null ? code : "");
        } else {
            userMsg = """
                    Action: %s
                    %s
                    Code:
                    ```
                    %s
                    ```
                    """.formatted(action, ctx, code != null ? code : "");
        }
        AiCompletionResult result = complete(model, system, userMsg);
        usageTracker.record(user, editorType(request.getContext()), "inline", model, userMsg, result.text(), result.usage());
        return PluginInlineResponse.builder().result(result.text()).build();
    }

    @Transactional
    public PluginCompletionResponse completion(User user, PluginCompletionRequest request) {
        touchContext(user, request.getContext());
        AiModel model = request.getModel() != null ? request.getModel() : AiModel.GROQ_LLAMA_70B;
        String prefix = request.getPrefix() != null ? request.getPrefix() : "";
        String suffix = request.getSuffix() != null ? request.getSuffix() : "";
        String system = "Complete the code at cursor. Return ONLY the completion text to insert, no explanation.";
        String userMsg = "Prefix:\n" + prefix + "\n\nSuffix:\n" + suffix;
        AiCompletionResult result = complete(model, system, userMsg);
        usageTracker.record(user, editorType(request.getContext()), "completion", model, userMsg, result.text(), result.usage());
        return PluginCompletionResponse.builder().completion(result.text()).build();
    }

    @Transactional
    public PluginChatResponse agent(User user, PluginChatRequest request) {
        touchContext(user, request.getContext());
        AiModel model = request.getModel() != null ? request.getModel() : AiModel.GROQ_LLAMA_70B;
        boolean hasMessage = request.getMessage() != null && !request.getMessage().isBlank();
        String ctx = contextBuilder.buildContextBlock(request.getContext());
        String system = """
                You are an autonomous coding agent. Analyze the project context, attachments and user goal.
                Respond with a clear step-by-step plan and concrete code changes in plain text.
                Answer in Vietnamese when the user writes in Vietnamese.
                """;
        String base = hasMessage ? request.getMessage() : "Lập kế hoạch dựa trên các file/code đính kèm.";
        String userMsg = messageBuilder.buildUserMessage(
                ctx + (ctx.isBlank() ? "" : "\n\n") + "Goal:\n" + base,
                request.getAttachments());
        var images = messageBuilder.extractImages(request.getAttachments()).stream()
                .map(i -> new ModelRouterService.ImageAttachment(i.name(), i.mimeType(), i.base64()))
                .toList();
        AiCompletionResult result = images.isEmpty()
                ? complete(model, system, userMsg)
                : completeWithImages(model, system, userMsg, images);
        usageTracker.record(user, editorType(request.getContext()), "agent", model, userMsg, result.text(), result.usage());
        return PluginChatResponse.builder().answer(result.text()).build();
    }

    @Transactional
    public PluginInlineResponse terminal(User user, String command, PluginContextPayload context) {
        touchContext(user, context);
        AiModel model = AiModel.GROQ_LLAMA_70B;
        AiCompletionResult result = complete(model,
                "Explain terminal commands clearly in Vietnamese.",
                "Command: " + command);
        usageTracker.record(user, editorType(context), "terminal", model, command, result.text(), result.usage());
        return PluginInlineResponse.builder().result(result.text()).build();
    }

    @Transactional(readOnly = true)
    public PluginUsageSummaryDto usageSummary(User user) {
        return PluginUsageSummaryDto.builder()
                .totalRequests(usageRepository.countByUserId(user.getId()))
                .totalTokens(usageRepository.sumTokensByUserId(user.getId()))
                .build();
    }

    @Transactional
    public void registerContext(User user, PluginContextPayload context) {
        touchContext(user, context);
    }

    private void touchContext(User user, PluginContextPayload context) {
        if (context == null) return;
        sessionService.touchSession(user, editorType(context), context.getProjectName(),
                context.getProjectName(), context.getExtensionVersion());
    }

    private PluginEditorType editorType(PluginContextPayload ctx) {
        return ctx != null && ctx.getEditorType() != null ? ctx.getEditorType() : PluginEditorType.VSCODE;
    }

    private AiCompletionResult complete(AiModel model, String system, String user) {
        return modelRouterService.callSimpleResult(model, system, user);
    }

    private AiCompletionResult completeWithImages(AiModel model, String system, String userMsg,
                                                  List<ModelRouterService.ImageAttachment> images) {
        return modelRouterService.callWithImagesResult(model, system, userMsg, images);
    }
}
