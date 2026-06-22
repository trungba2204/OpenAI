package com.ai.platform.knowledge.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class KnowledgeChatResponse {

    private String answer;
    private List<String> sources;
    private Long sessionId;
}
