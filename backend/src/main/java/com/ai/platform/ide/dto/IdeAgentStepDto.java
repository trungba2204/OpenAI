package com.ai.platform.ide.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdeAgentStepDto {
    private int step;
    private String title;
    private String detail;
}
