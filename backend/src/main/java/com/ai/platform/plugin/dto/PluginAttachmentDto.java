package com.ai.platform.plugin.dto;

import lombok.Data;

@Data
public class PluginAttachmentDto {
    /** snippet | file | image */
    private String kind;
    private String name;
    private String path;
    private Integer startLine;
    private Integer endLine;
    /** Text content or base64 for images */
    private String content;
    private String mimeType;
}
