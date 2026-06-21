package com.ai.platform.ide.dto;

import com.ai.platform.ai.AiModel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IdeInlineRequest {
    @NotNull
    private Long projectId;
    private Long fileId;
    @NotBlank
    private String selectedCode;
    /** EXPLAIN, REFACTOR, OPTIMIZE, TEST */
    @NotBlank
    private String action;
    private AiModel model;
    private Integer startLine;
    private Integer endLine;
    private String selectedFilePath;
}
