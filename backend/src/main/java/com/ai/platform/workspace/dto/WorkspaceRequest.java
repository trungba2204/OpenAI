package com.ai.platform.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class WorkspaceRequest {
    @NotBlank
    @Size(max = 255)
    private String name;
}
