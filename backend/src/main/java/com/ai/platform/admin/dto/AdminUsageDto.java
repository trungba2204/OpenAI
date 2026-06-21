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
public class AdminUsageDto {
    private Long id;
    private Long userId;
    private String userEmail;
    private Long conversationId;
    private String model;
    private String prompt;
    private String response;
    private int inputTokens;
    private int outputTokens;
    private int totalTokens;
    private BigDecimal cost;
    private LocalDateTime createdAt;
}
