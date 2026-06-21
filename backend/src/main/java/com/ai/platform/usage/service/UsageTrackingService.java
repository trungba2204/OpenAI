package com.ai.platform.usage.service;

import com.ai.platform.ai.AiModel;
import com.ai.platform.chat.entity.Conversation;
import com.ai.platform.usage.entity.AiUsage;
import com.ai.platform.usage.repository.AiUsageRepository;
import com.ai.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class UsageTrackingService {

    private static final BigDecimal COST_PER_1K_TOKENS = new BigDecimal("0.0002");

    private final AiUsageRepository aiUsageRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordUsage(User user, Conversation conversation, AiModel model,
                            String prompt, String response) {
        int inputTokens = estimateTokens(prompt);
        int outputTokens = estimateTokens(response);
        int totalTokens = inputTokens + outputTokens;
        BigDecimal cost = estimateCost(totalTokens);

        aiUsageRepository.save(AiUsage.builder()
                .user(user)
                .conversation(conversation)
                .modelName(model != null ? model.name() : "UNKNOWN")
                .prompt(truncate(prompt, 4000))
                .response(truncate(response, 4000))
                .inputTokens(inputTokens)
                .outputTokens(outputTokens)
                .totalTokens(totalTokens)
                .estimatedCost(cost)
                .build());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordUsage(User user, Conversation conversation, String modelName,
                            String prompt, String response) {
        AiModel model = AiModel.fromModelId(modelName);
        if (model == null) {
            try {
                model = AiModel.valueOf(modelName);
            } catch (IllegalArgumentException ignored) {
                model = null;
            }
        }
        recordUsage(user, conversation, model, prompt, response);
    }

    private int estimateTokens(String text) {
        if (text == null || text.isBlank()) {
            return 0;
        }
        return Math.max(1, text.length() / 4);
    }

    private BigDecimal estimateCost(int totalTokens) {
        return COST_PER_1K_TOKENS
                .multiply(BigDecimal.valueOf(totalTokens))
                .divide(BigDecimal.valueOf(1000), 6, RoundingMode.HALF_UP);
    }

    private String truncate(String text, int max) {
        if (text == null) {
            return null;
        }
        return text.length() <= max ? text : text.substring(0, max) + "...";
    }
}
