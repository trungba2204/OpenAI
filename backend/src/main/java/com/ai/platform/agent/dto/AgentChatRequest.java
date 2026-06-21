package com.ai.platform.agent.dto;

import com.ai.platform.ai.AiModel;
import lombok.Data;

@Data
public class AgentChatRequest {
    private Long conversationId;
    private String content;
    private AiModel model;
}
