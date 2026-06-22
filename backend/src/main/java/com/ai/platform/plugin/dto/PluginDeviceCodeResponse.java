package com.ai.platform.plugin.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PluginDeviceCodeResponse {
    private String code;
    private LocalDateTime expiresAt;
}
