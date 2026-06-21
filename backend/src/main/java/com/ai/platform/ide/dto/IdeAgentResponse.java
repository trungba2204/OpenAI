package com.ai.platform.ide.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdeAgentResponse {
    private Long runId;
    private List<IdeAgentStepDto> steps;
    private String result;
    private List<IdeFileEditDto> edits;
}
