package com.ai.platform.plugin.dto;

import com.ai.platform.plugin.entity.PluginEditorType;
import lombok.Data;

@Data
public class PluginSelectionDto {
    private Integer startLine;
    private Integer endLine;
    private String text;
}
