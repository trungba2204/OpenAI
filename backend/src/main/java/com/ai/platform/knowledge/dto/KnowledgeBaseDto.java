package com.ai.platform.knowledge.dto;

import com.ai.platform.knowledge.entity.KnowledgeStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class KnowledgeBaseDto {

    private Long id;
    private String name;
    private String description;
    private String systemPrompt;
    private String persona;
    private KnowledgeStatus status;
    private long documentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
