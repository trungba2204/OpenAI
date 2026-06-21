package com.ai.platform.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardDto {
    private long totalUsers;
    private long totalChats;
    private long totalRequests;
    private long totalTokens;
    private BigDecimal totalCost;
    private long activeUsersToday;
}
