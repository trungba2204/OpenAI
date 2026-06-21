package com.ai.platform.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.chat.prompt.Prompt;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Slf4j
public class FallbackChatModel implements ChatModel {

    private final List<OpenAiCompatibleChatModel> providers;
    private final AiProperties properties;

    public FallbackChatModel(List<OpenAiCompatibleChatModel> providers, AiProperties properties) {
        this.providers = providers.stream()
                .filter(OpenAiCompatibleChatModel::isConfigured)
                .sorted(Comparator.comparingInt(p -> providerPriority(p, properties)))
                .toList();
        this.properties = properties;
    }

    @Override
    public ChatResponse call(Prompt prompt) {
        ensureProviders();
        Exception lastError = null;
        List<Attempt> attempts = buildAttempts(prompt);
        for (Attempt attempt : attempts) {
            try {
                log.debug("AI call via {} model={}", attempt.provider().getProviderName(), attempt.model());
                return attempt.provider().call(attempt.prompt());
            } catch (Exception e) {
                lastError = e;
                if (!AiErrorMapper.isRetryable(e)) {
                    throw e instanceof RuntimeException runtime ? runtime : new IllegalStateException(e.getMessage(), e);
                }
                log.warn("AI provider {} failed: {}", attempt.provider().getProviderName(), e.getMessage());
            }
        }
        throw new IllegalStateException(AiErrorMapper.toUserMessage(lastError), lastError);
    }

    @Override
    public Flux<ChatResponse> stream(Prompt prompt) {
        ensureProviders();
        return Flux.defer(() -> {
            try {
                return Flux.just(call(prompt));
            } catch (Exception e) {
                return Flux.error(e);
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    @Override
    public ChatOptions getDefaultOptions() {
        return ChatOptions.builder().model(properties.getDefaultModel()).build();
    }

    private void ensureProviders() {
        if (providers.isEmpty()) {
            throw new IllegalStateException(
                    "Chưa cấu hình API key. Thêm Groq, OpenRouter hoặc Gemini key vào application-local.yml");
        }
    }

    private List<Attempt> buildAttempts(Prompt prompt) {
        String requestedModel = resolveModel(prompt);
        AiModel aiModel = AiModel.fromModelId(requestedModel);
        List<Attempt> attempts = new ArrayList<>();

        if (aiModel != null) {
            OpenAiCompatibleChatModel preferred = findProvider(aiModel.getProvider());
            if (preferred != null) {
                attempts.add(new Attempt(preferred, withModel(prompt, aiModel.getModelId())));
            }
        } else if (!providers.isEmpty()) {
            attempts.add(new Attempt(providers.get(0), withModel(prompt, requestedModel)));
        }

        for (OpenAiCompatibleChatModel provider : providers) {
            if (attempts.stream().anyMatch(a -> a.provider() == provider)) {
                continue;
            }
            attempts.add(new Attempt(provider, withModel(prompt, fallbackModelFor(provider))));
        }

        return attempts;
    }

    private OpenAiCompatibleChatModel findProvider(AiProvider provider) {
        String name = provider.name().toLowerCase();
        return providers.stream()
                .filter(p -> p.getProviderName().equalsIgnoreCase(name))
                .findFirst()
                .orElse(null);
    }

    private String fallbackModelFor(OpenAiCompatibleChatModel provider) {
        if ("groq".equalsIgnoreCase(provider.getProviderName())) {
            return "llama-3.1-8b-instant";
        }
        if ("gemini".equalsIgnoreCase(provider.getProviderName())) {
            return properties.getFallbackModel();
        }
        if ("openrouter".equalsIgnoreCase(provider.getProviderName())) {
            return "meta-llama/llama-3.1-8b-instruct:free";
        }
        return properties.getDefaultModel();
    }

    private Prompt withModel(Prompt prompt, String model) {
        return new Prompt(prompt.getInstructions(), ChatOptions.builder().model(model).build());
    }

    private String resolveModel(Prompt prompt) {
        if (prompt.getOptions() != null && prompt.getOptions().getModel() != null) {
            return prompt.getOptions().getModel();
        }
        return properties.getDefaultModel();
    }

    private int providerPriority(OpenAiCompatibleChatModel provider, AiProperties properties) {
        AiProviderConfig config = properties.getProviders().get(provider.getProviderName());
        return config != null ? config.getPriority() : 99;
    }

    private record Attempt(OpenAiCompatibleChatModel provider, Prompt prompt) {
        String model() {
            return prompt.getOptions() != null ? prompt.getOptions().getModel() : "";
        }
    }
}
