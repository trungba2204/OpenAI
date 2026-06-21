package com.ai.platform.agent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentRunDto {
    private Long id;
    private String toolName;
    private String input;
    private String output;
    private LocalDateTime createdAt;
}
