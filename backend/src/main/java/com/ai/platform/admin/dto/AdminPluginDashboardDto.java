package com.ai.platform.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPluginDashboardDto {
    private long totalInstallations;
    private long activeSessions;
    private long totalRequests;
    private long totalTokens;
    private List<LabelValueDto> requestsByEditor;
    private List<LabelValueDto> requestsByEndpoint;
    private List<SeriesPointDto> requestsPerDay;
}
