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
public class TokenAnalyticsDto {
    private List<SeriesPointDto> tokensPerDay;
    private List<LabelValueDto> tokensPerModel;
    private List<LabelValueDto> tokensPerUser;
}
