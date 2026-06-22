package com.ai.platform.plugin.service;

import com.ai.platform.ai.AiModel;
import com.ai.platform.plugin.entity.PluginEditorType;
import com.ai.platform.plugin.entity.PluginUsage;
import com.ai.platform.plugin.repository.PluginUsageRepository;
import com.ai.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class PluginUsageTracker {

    private final PluginUsageRepository usageRepository;

    @Transactional
    public void record(User user, PluginEditorType editorType, String endpoint, AiModel model, String prompt, String response) {
        int tokens = estimateTokens(prompt) + estimateTokens(response);
        usageRepository.save(PluginUsage.builder()
                .user(user)
                .editorType(editorType != null ? editorType : PluginEditorType.VSCODE)
                .endpoint(endpoint)
                .modelName(model != null ? model.getModelId() : null)
                .tokens(tokens)
                .cost(BigDecimal.ZERO)
                .build());
    }

    private int estimateTokens(String text) {
        if (text == null || text.isBlank()) return 0;
        return Math.max(1, text.length() / 4);
    }
}
