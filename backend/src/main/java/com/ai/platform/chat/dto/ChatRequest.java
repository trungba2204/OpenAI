package com.ai.platform.chat.dto;

import com.ai.platform.ai.AiModel;
import lombok.Data;

@Data
public class ChatRequest {
    private Long conversationId;
    private String content;
    private String displayContent;
    private AiModel model;
    private boolean agentMode;
    private Long attachmentDocumentId;
    private String attachmentFilename;
    private String attachmentMimeType;
    private Long knowledgeBaseId;
}
