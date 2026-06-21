package com.ai.platform.ai;

import java.util.Arrays;

public enum AiModel {
    GROQ_LLAMA_70B("llama-3.3-70b-versatile", "Llama 3.3 70B (Free)", AiProvider.GROQ),
    OR_DEEPSEEK_CHAT("deepseek/deepseek-chat", "OR DeepSeek Chat", AiProvider.OPENROUTER),
    OR_GPT4O_MINI("openai/gpt-4o-mini", "OR GPT-4o Mini", AiProvider.OPENROUTER);

    private final String modelId;
    private final String displayName;
    private final AiProvider provider;

    AiModel(String modelId, String displayName, AiProvider provider) {
        this.modelId = modelId;
        this.displayName = displayName;
        this.provider = provider;
    }

    public String getModelId() {
        return modelId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public AiProvider getProvider() {
        return provider;
    }

    public static AiModel fromModelId(String modelId) {
        return Arrays.stream(values())
                .filter(model -> model.modelId.equals(modelId))
                .findFirst()
                .orElse(null);
    }
}
