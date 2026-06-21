package com.ai.platform.ppt.dto;

import lombok.Data;

@Data
public class PptGenerateRequest {
    private String markdown;
    private String requirement;
}
