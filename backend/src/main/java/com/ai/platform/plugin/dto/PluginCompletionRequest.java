package com.ai.platform.plugin.dto;

import com.ai.platform.ai.AiModel;
import lombok.Data;

@Data
public class PluginCompletionRequest {
    private PluginContextPayload context;
    private String prefix;
    private String suffix;
    private AiModel model;
}
