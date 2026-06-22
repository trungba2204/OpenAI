package com.ai.platform.plugin.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PluginUsageSummaryDto {
    private long totalRequests;
    private long totalTokens;
}
