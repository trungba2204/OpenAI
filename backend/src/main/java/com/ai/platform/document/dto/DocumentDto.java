package com.ai.platform.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDto {
    private Long id;
    private String filename;
    private String mimeType;
    private Long fileSize;
    private String extractedTextPreview;
    private LocalDateTime createdAt;
}
