package com.ai.platform.ai;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.LinkedHashMap;
import java.util.Map;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.ai")
public class AiProperties {

    private String defaultModel = "llama-3.1-8b-instant";
    private String fallbackModel = "gemini-2.0-flash-lite";
    private Map<String, AiProviderConfig> providers = new LinkedHashMap<>();
}
