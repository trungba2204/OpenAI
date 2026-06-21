package com.ai.platform.project.dto;

import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
public class FileTreeNodeDto {
    private Long id;
    private String name;
    private String path;
    private boolean directory;
    private String mimeType;
    private long sizeBytes;
    @Builder.Default
    private List<FileTreeNodeDto> children = new ArrayList<>();
}
