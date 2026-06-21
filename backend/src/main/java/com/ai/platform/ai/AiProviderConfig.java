package com.ai.platform.ai;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiProviderConfig {

    private boolean enabled = true;
    private int priority = 1;
    private String baseUrl = "";
    private String apiKey = "";
    private String completionsPath = "/chat/completions";
    private String defaultModel = "";
    private String httpReferer = "";
    private String appTitle = "";
}
