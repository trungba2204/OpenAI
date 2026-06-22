package com.ai.platform.plugin.service;

import com.ai.platform.plugin.dto.PluginContextPayload;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PluginContextBuilder {

    public String buildContextBlock(PluginContextPayload ctx) {
        if (ctx == null) return "";
        StringBuilder sb = new StringBuilder();
        if (ctx.getProjectName() != null) {
            sb.append("Project: ").append(ctx.getProjectName()).append("\n");
        }
        if (ctx.getActiveFile() != null) {
            sb.append("Active file: ").append(ctx.getActiveFile());
            if (ctx.getLanguage() != null) sb.append(" (").append(ctx.getLanguage()).append(")");
            sb.append("\n");
        }
        if (ctx.getOpenFiles() != null && !ctx.getOpenFiles().isEmpty()) {
            sb.append("Open files: ").append(String.join(", ", ctx.getOpenFiles())).append("\n");
        }
        if (ctx.getFileTree() != null && !ctx.getFileTree().isBlank()) {
            sb.append("File tree:\n").append(truncate(ctx.getFileTree(), 8000)).append("\n");
        }
        if (ctx.getActiveFileContent() != null && !ctx.getActiveFileContent().isBlank()) {
            sb.append("Active file content:\n```\n").append(truncate(ctx.getActiveFileContent(), 12000)).append("\n```\n");
        }
        if (ctx.getSelection() != null && ctx.getSelection().getText() != null && !ctx.getSelection().getText().isBlank()) {
            sb.append("Selected code (lines ").append(ctx.getSelection().getStartLine())
                    .append("-").append(ctx.getSelection().getEndLine()).append("):\n```\n")
                    .append(ctx.getSelection().getText()).append("\n```\n");
        }
        return sb.toString();
    }

    private String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max) + "\n...";
    }
}
