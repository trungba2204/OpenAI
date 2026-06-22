package com.ai.platform.plugin.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PluginSessionDto {
    private Long id;
    private String editorType;
    private String projectName;
    private LocalDateTime createdAt;
    private LocalDateTime lastSeenAt;
}
