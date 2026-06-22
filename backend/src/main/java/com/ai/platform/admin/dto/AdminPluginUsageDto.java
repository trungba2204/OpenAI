package com.ai.platform.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPluginUsageDto {
    private Long id;
    private Long userId;
    private String userEmail;
    private String editorType;
    private String endpoint;
    private String modelName;
    private int tokens;
    private int inputTokens;
    private int outputTokens;
    private BigDecimal cost;
    private LocalDateTime createdAt;
}
