package com.ai.platform.ai;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.ai.chat.model.ChatResponse;

public record AiTokenUsage(int inputTokens, int outputTokens, int totalTokens) {

    public static AiTokenUsage fromChatResponse(ChatResponse response) {
        if (response == null || response.getMetadata() == null) {
            return empty();
        }
        return fromUsage(response.getMetadata().getUsage());
    }

    public static AiTokenUsage fromUsage(Usage usage) {
        if (usage == null) {
            return empty();
        }
        int input = nullSafe(usage.getPromptTokens());
        int output = nullSafe(usage.getCompletionTokens());
        int total = nullSafe(usage.getTotalTokens());
        if (total == 0 && (input > 0 || output > 0)) {
            total = input + output;
        }
        return new AiTokenUsage(input, output, total);
    }

    public static AiTokenUsage fromJsonNode(JsonNode usage) {
        if (usage == null || usage.isMissingNode()) {
            return empty();
        }
        int input = usage.path("prompt_tokens").asInt(0);
        int output = usage.path("completion_tokens").asInt(0);
        int total = usage.path("total_tokens").asInt(0);
        if (total == 0 && (input > 0 || output > 0)) {
            total = input + output;
        }
        return new AiTokenUsage(input, output, total);
    }

    public static AiTokenUsage estimate(String prompt, String response) {
        int input = estimateText(prompt);
        int output = estimateText(response);
        return new AiTokenUsage(input, output, input + output);
    }

    private static int estimateText(String text) {
        if (text == null || text.isBlank()) {
            return 0;
        }
        return Math.max(1, text.length() / 4);
    }

    private static int nullSafe(Integer value) {
        return value != null ? value : 0;
    }

    public static AiTokenUsage empty() {
        return new AiTokenUsage(0, 0, 0);
    }

    public boolean isKnown() {
        return totalTokens > 0;
    }

    public AiTokenUsage orEstimate(String prompt, String response) {
        if (isKnown()) {
            return this;
        }
        return estimate(prompt, response);
    }
}
