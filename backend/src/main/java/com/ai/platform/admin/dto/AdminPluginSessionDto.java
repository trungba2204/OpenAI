package com.ai.platform.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPluginSessionDto {
    private Long id;
    private Long userId;
    private String userEmail;
    private String editorType;
    private String projectName;
    private LocalDateTime createdAt;
    private LocalDateTime lastSeenAt;
}
