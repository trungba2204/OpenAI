package com.ai.platform.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostAnalyticsDto {
    private BigDecimal today;
    private BigDecimal month;
    private BigDecimal year;
    private List<DecimalSeriesPointDto> costPerDay;
}
