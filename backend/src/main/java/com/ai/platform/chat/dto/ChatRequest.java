package com.ai.platform.chat.dto;

import com.ai.platform.ai.AiModel;
import lombok.Data;

@Data
public class ChatRequest {
    private Long conversationId;
    private String content;
    private AiModel model;
    private boolean agentMode;
}
