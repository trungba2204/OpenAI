package com.ai.platform.plugin.service;

import com.ai.platform.ai.AiModel;
import com.ai.platform.ai.AiTokenUsage;
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
    public void record(User user, PluginEditorType editorType, String endpoint, AiModel model,
                       String prompt, String response, AiTokenUsage usage) {
        AiTokenUsage resolved = usage != null ? usage : AiTokenUsage.empty();
        if (!resolved.isKnown()) {
            resolved = resolved.orEstimate(prompt, response);
        }
        usageRepository.save(PluginUsage.builder()
                .user(user)
                .editorType(editorType != null ? editorType : PluginEditorType.VSCODE)
                .endpoint(endpoint)
                .modelName(model != null ? model.getModelId() : null)
                .tokens(resolved.totalTokens())
                .inputTokens(resolved.inputTokens())
                .outputTokens(resolved.outputTokens())
                .cost(BigDecimal.ZERO)
                .build());
    }
}
