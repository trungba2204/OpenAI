package com.ai.platform.chat.dto;

import com.ai.platform.ai.AiModel;
import lombok.Data;

@Data
public class CreateConversationRequest {
    private String title;
    private AiModel model;
}
