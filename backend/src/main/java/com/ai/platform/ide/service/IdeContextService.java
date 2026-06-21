package com.ai.platform.ide.service;

import com.ai.platform.ide.entity.ProjectChunk;
import com.ai.platform.ide.entity.ProjectIndex;
import com.ai.platform.project.entity.Project;
import com.ai.platform.project.entity.ProjectFile;
import com.ai.platform.project.repository.ProjectFileRepository;
import com.ai.platform.project.service.ProjectFileService;
import com.ai.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IdeContextService {

    private final ProjectFileRepository projectFileRepository;
    private final ProjectFileService projectFileService;
    private final ProjectIndexService projectIndexService;

    public String buildContext(User user, Project project, Long fileId, String scope, String userMessage) throws IOException {
        StringBuilder sb = new StringBuilder();
        sb.append("Project: ").append(project.getName()).append("\n");
        String normalizedScope = scope != null ? scope.toUpperCase() : "PROJECT";

        switch (normalizedScope) {
            case "FILE" -> appendFileContext(user, sb, project, fileId);
            case "FOLDER" -> appendFolderContext(user, sb, project, fileId);
            case "RAG" -> appendRagContext(sb, project, userMessage);
            default -> appendProjectContext(user, sb, project, userMessage);
        }
        return sb.toString();
    }

    private void appendFileContext(User user, StringBuilder sb, Project project, Long fileId) throws IOException {
        if (fileId == null) {
            sb.append("(No file selected)\n");
            return;
        }
        ProjectFile file = projectFileRepository.findByIdAndProjectId(fileId, project.getId()).orElse(null);
        if (file == null || file.isDirectory()) return;
        appendFileContent(user, sb, file, 16000);
    }

    private void appendFolderContext(User user, StringBuilder sb, Project project, Long fileId) throws IOException {
        ProjectFile current = fileId != null
                ? projectFileRepository.findByIdAndProjectId(fileId, project.getId()).orElse(null)
                : null;
        String folderPrefix = "";
        if (current != null) {
            String path = current.isDirectory() ? current.getPath() : parentPath(current.getPath());
            folderPrefix = path.isEmpty() ? "" : path + "/";
            sb.append("Folder: ").append(path.isEmpty() ? "/" : path).append("\n");
        }
        List<ProjectFile> files = projectFileRepository.findByProjectIdOrderByPathAsc(project.getId());
        String prefix = folderPrefix;
        List<ProjectFile> inFolder = files.stream()
                .filter(f -> !f.isDirectory())
                .filter(f -> prefix.isEmpty() || f.getPath().startsWith(prefix))
                .filter(f -> ProjectFileService.isTextFile(f.getName()))
                .limit(8)
                .collect(Collectors.toList());
        for (ProjectFile f : inFolder) {
            appendFileContent(user, sb, f, 4000);
        }
    }

    private void appendProjectContext(User user, StringBuilder sb, Project project, String userMessage) throws IOException {
        List<ProjectFile> files = projectFileRepository.findByProjectIdOrderByPathAsc(project.getId())
                .stream().filter(f -> !f.isDirectory()).limit(200).collect(Collectors.toList());
        sb.append("Files (").append(files.size()).append("):\n");
        for (ProjectFile f : files) {
            sb.append("- ").append(f.getPath()).append("\n");
        }
        if (userMessage != null && !userMessage.isBlank()) {
            List<ProjectIndex> symbols = projectIndexService.searchSymbols(project.getId(), userMessage);
            if (!symbols.isEmpty()) {
                sb.append("\nRelevant symbols:\n");
                for (ProjectIndex s : symbols.stream().limit(10).toList()) {
                    sb.append("- ").append(s.getFilePath()).append(":").append(s.getLineNumber())
                            .append(" ").append(s.getSymbolType()).append(" ").append(s.getSymbolName()).append("\n");
                }
            }
        }
    }

    private void appendRagContext(StringBuilder sb, Project project, String userMessage) {
        sb.append("RAG retrieval for: ").append(userMessage).append("\n\n");
        List<ProjectChunk> chunks = projectIndexService.searchChunks(project.getId(), userMessage);
        List<ProjectIndex> symbols = projectIndexService.searchSymbols(project.getId(), userMessage);
        for (ProjectIndex s : symbols.stream().limit(5).toList()) {
            sb.append("Symbol: ").append(s.getFilePath()).append(":").append(s.getLineNumber())
                    .append(" — ").append(s.getSymbolName()).append("\n");
        }
        for (ProjectChunk c : chunks) {
            sb.append("\n--- ").append(c.getFilePath()).append(" (chunk ").append(c.getChunkIndex()).append(") ---\n");
            sb.append(truncate(c.getContent(), 2000)).append("\n");
        }
    }

    private void appendFileContent(User user, StringBuilder sb, ProjectFile file, int maxLen) throws IOException {
        sb.append("\n### ").append(file.getPath()).append("\n");
        var content = projectFileService.getContent(user, file.getId());
        String text = content.getContent();
        if (text.length() > maxLen) text = text.substring(0, maxLen) + "\n... (truncated)";
        sb.append("```\n").append(text).append("\n```\n");
    }

    private String parentPath(String path) {
        int slash = path.lastIndexOf('/');
        return slash < 0 ? "" : path.substring(0, slash);
    }

    private String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }
}
