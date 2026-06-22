package com.ai.platform.knowledge.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class KnowledgeChatRequest {

    @NotBlank
    private String message;

    private Long sessionId;
}
