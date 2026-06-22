package com.ai.platform.plugin.service;

import com.ai.platform.plugin.dto.PluginAttachmentDto;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class PluginMessageBuilder {

    public record VisionImage(String name, String mimeType, String base64) {}

    public String buildUserMessage(String userText, List<PluginAttachmentDto> attachments) {
        StringBuilder sb = new StringBuilder();
        if (attachments != null) {
            for (PluginAttachmentDto a : attachments) {
                if (a == null || "image".equalsIgnoreCase(a.getKind())) continue;
                if (sb.length() > 0) sb.append("\n\n");
                String label = buildLabel(a);
                String body = a.getContent() != null ? a.getContent() : "";
                sb.append("--- ").append(label).append(" ---\n").append(body);
            }
        }
        if (userText != null && !userText.isBlank()) {
            if (sb.length() > 0) sb.append("\n\n");
            sb.append(userText.trim());
        }
        return sb.toString();
    }

    public List<VisionImage> extractImages(List<PluginAttachmentDto> attachments) {
        List<VisionImage> images = new ArrayList<>();
        if (attachments == null) return images;
        for (PluginAttachmentDto a : attachments) {
            if (a == null || !"image".equalsIgnoreCase(a.getKind())) continue;
            if (a.getContent() == null || a.getContent().isBlank()) continue;
            String mime = a.getMimeType() != null ? a.getMimeType() : "image/png";
            String name = a.getName() != null ? a.getName() : a.getPath();
            images.add(new VisionImage(name != null ? name : "image", mime, a.getContent()));
        }
        return images;
    }

    public PluginAttachmentDto firstSnippet(List<PluginAttachmentDto> attachments) {
        if (attachments == null) return null;
        return attachments.stream()
                .filter(a -> a != null && "snippet".equalsIgnoreCase(a.getKind()))
                .findFirst()
                .orElse(null);
    }

    private String buildLabel(PluginAttachmentDto a) {
        String path = a.getPath() != null ? a.getPath() : a.getName();
        if ("file".equalsIgnoreCase(a.getKind())) {
            return path + " (toàn file)";
        }
        if (a.getStartLine() != null && a.getEndLine() != null) {
            return path + " (dòng " + a.getStartLine() + "-" + a.getEndLine() + ")";
        }
        return path != null ? path : "snippet";
    }
}
