package com.ai.platform.prompt.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PromptTemplateRequest {
    @NotBlank
    private String title;
    @NotBlank
    private String content;
    private String category;
    private boolean isPublic;
}
