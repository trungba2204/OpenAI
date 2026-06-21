package com.ai.platform.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FileRequest {
    private Long projectId;
    private Long parentId;
    @NotBlank
    @Size(max = 512)
    private String name;
    private boolean directory;
    private String content;
}
