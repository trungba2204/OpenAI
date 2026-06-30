package com.ai.platform.plugin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PluginConnectionStatusDto {
    private boolean connected;
    private String editorType;
    private String projectName;
    private LocalDateTime lastSeenAt;
}
