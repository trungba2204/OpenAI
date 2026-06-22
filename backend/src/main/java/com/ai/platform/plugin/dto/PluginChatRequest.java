package com.ai.platform.plugin.dto;

import com.ai.platform.ai.AiModel;
import lombok.Data;

import java.util.List;

@Data
public class PluginChatRequest {
    private PluginContextPayload context;
    private String message;
    private AiModel model;
    private Long knowledgeBaseId;
    private List<PluginAttachmentDto> attachments;
}
