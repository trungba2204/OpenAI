package com.ai.platform.ide.dto;

import com.ai.platform.ai.AiModel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IdePromptRequest {
    @NotNull
    private Long projectId;
    private Long fileId;
    @NotBlank
    private String prompt;
    private AiModel model;
}
