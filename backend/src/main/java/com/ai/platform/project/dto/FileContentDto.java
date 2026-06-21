package com.ai.platform.project.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FileContentDto {
    private Long id;
    private String name;
    private String path;
    private String content;
    private String mimeType;
}
