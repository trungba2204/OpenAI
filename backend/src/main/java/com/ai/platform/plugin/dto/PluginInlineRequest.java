package com.ai.platform.plugin.dto;

import com.ai.platform.ai.AiModel;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class PluginInlineRequest {
    private PluginContextPayload context;
    @NotBlank
    private String action;
    private String code;
    private Integer startLine;
    private Integer endLine;
    private String instruction;
    private AiModel model;
    private List<PluginAttachmentDto> attachments;
}
