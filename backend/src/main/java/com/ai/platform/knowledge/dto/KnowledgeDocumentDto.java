package com.ai.platform.knowledge.dto;

import com.ai.platform.knowledge.entity.KnowledgeDocumentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class KnowledgeDocumentDto {

    private Long id;
    private Long knowledgeBaseId;
    private String fileName;
    private Long fileSize;
    private String mimeType;
    private KnowledgeDocumentStatus status;
    private String errorMessage;
    private LocalDateTime uploadedAt;
}
