package com.ai.platform.workspace.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class WorkspaceDto {
    private Long id;
    private String name;
    private int projectCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
