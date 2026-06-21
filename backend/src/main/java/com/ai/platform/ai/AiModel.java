package com.ai.platform.ai;

import java.util.Arrays;

public enum AiModel {
    GROQ_LLAMA_8B("llama-3.1-8b-instant", "Llama 3.1 8B (Free)", AiProvider.GROQ),
    GROQ_LLAMA_70B("llama-3.3-70b-versatile", "Llama 3.3 70B (Free)", AiProvider.GROQ),
    GROQ_GEMMA("gemma2-9b-it", "Gemma 2 9B (Free)", AiProvider.GROQ),
    GEMINI_FLASH_LITE("gemini-2.0-flash-lite", "Gemini 2.0 Flash Lite", AiProvider.GEMINI),
    GEMINI_FLASH("gemini-2.0-flash", "Gemini 2.0 Flash", AiProvider.GEMINI),
    GEMINI_15_FLASH("gemini-1.5-flash", "Gemini 1.5 Flash", AiProvider.GEMINI),
    OR_LLAMA_8B_FREE("meta-llama/llama-3.1-8b-instruct:free", "OR Llama 3.1 8B (Free)", AiProvider.OPENROUTER),
    OR_GEMINI_FLASH_LITE_FREE("google/gemini-2.0-flash-lite-preview-02-05:free", "OR Gemini 2.0 Flash Lite (Free)", AiProvider.OPENROUTER),
    OR_QWEN_FREE("qwen/qwen-2.5-7b-instruct:free", "OR Qwen 2.5 7B (Free)", AiProvider.OPENROUTER),
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
