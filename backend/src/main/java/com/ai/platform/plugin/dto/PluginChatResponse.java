package com.ai.platform.plugin.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PluginChatResponse {
    private String answer;
    private List<String> sources;
}
