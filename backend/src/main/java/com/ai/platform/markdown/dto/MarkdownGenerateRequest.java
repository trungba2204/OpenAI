package com.ai.platform.markdown.dto;

import lombok.Data;

@Data
public class MarkdownGenerateRequest {
    private String source;
    private String content;
    private Long documentId;
}
