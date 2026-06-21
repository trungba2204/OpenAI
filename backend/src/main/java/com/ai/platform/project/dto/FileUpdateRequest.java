package com.ai.platform.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FileUpdateRequest {
    @Size(max = 512)
    private String name;
    private String content;
}
