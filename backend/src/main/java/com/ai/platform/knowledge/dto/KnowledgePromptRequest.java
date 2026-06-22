package com.ai.platform.knowledge.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class KnowledgePromptRequest {

    @NotBlank
    private String systemPrompt;
}
