package com.ai.platform.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
public class OpenAiCompatibleChatModel implements ChatModel {

    private final String providerName;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final AiProviderConfig config;

    public OpenAiCompatibleChatModel(String providerName, AiProviderConfig config, ObjectMapper objectMapper,
                                     WebClient.Builder webClientBuilder) {
        this.providerName = providerName;
        this.config = config;
        this.objectMapper = objectMapper;
        WebClient.Builder builder = webClientBuilder.clone()
                .baseUrl(config.getBaseUrl())
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + config.getApiKey());
        if (config.getHttpReferer() != null && !config.getHttpReferer().isBlank()) {
            builder.defaultHeader("HTTP-Referer", config.getHttpReferer());
        }
        if (config.getAppTitle() != null && !config.getAppTitle().isBlank()) {
            builder.defaultHeader("X-Title", config.getAppTitle());
        }
        this.webClient = builder.build();
    }

    public String getProviderName() {
        return providerName;
    }

    public boolean isConfigured() {
        return config.isEnabled()
                && config.getApiKey() != null
                && !config.getApiKey().isBlank()
                && !"placeholder".equals(config.getApiKey());
    }

    @Override
    public ChatResponse call(Prompt prompt) {
        String model = resolveModel(prompt);
        try {
            JsonNode response = webClient.post()
                    .uri(config.getCompletionsPath())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(buildRequestBody(prompt, model, false))
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();
            return toChatResponse(extractCompletionText(response));
        } catch (WebClientResponseException e) {
            throw wrapError(e);
        }
    }

    @Override
    public Flux<ChatResponse> stream(Prompt prompt) {
        String model = resolveModel(prompt);
        return webClient.post()
                .uri(config.getCompletionsPath())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(buildRequestBody(prompt, model, true))
                .retrieve()
                .bodyToFlux(String.class)
                .flatMap(chunk -> Flux.fromArray(chunk.split("\n")))
                .map(String::trim)
                .filter(line -> line.startsWith("data:"))
                .map(line -> line.substring(5).trim())
                .filter(json -> !json.isEmpty() && !"[DONE]".equals(json))
                .mapNotNull(this::parseStreamChunk)
                .filter(text -> !text.isEmpty())
                .map(this::toChatResponse)
                .onErrorMap(WebClientResponseException.class, this::wrapError);
    }

    @Override
    public ChatOptions getDefaultOptions() {
        String model = config.getDefaultModel() != null && !config.getDefaultModel().isBlank()
                ? config.getDefaultModel()
                : "llama-3.3-70b-versatile";
        return ChatOptions.builder().model(model).build();
    }

    private String resolveModel(Prompt prompt) {
        if (prompt.getOptions() != null && prompt.getOptions().getModel() != null) {
            return prompt.getOptions().getModel();
        }
        if (config.getDefaultModel() != null && !config.getDefaultModel().isBlank()) {
            return config.getDefaultModel();
        }
        return "llama-3.3-70b-versatile";
    }

    private Map<String, Object> buildRequestBody(Prompt prompt, String model, boolean stream) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", toOpenAiMessages(prompt));
        body.put("stream", stream);
        return body;
    }

    private List<Map<String, String>> toOpenAiMessages(Prompt prompt) {
        List<Map<String, String>> messages = new ArrayList<>();
        for (Message message : prompt.getInstructions()) {
            if (message instanceof SystemMessage systemMessage) {
                messages.add(openAiMessage("system", systemMessage.getText()));
            } else if (message instanceof UserMessage userMessage) {
                messages.add(openAiMessage("user", userMessage.getText()));
            } else if (message instanceof AssistantMessage assistantMessage) {
                messages.add(openAiMessage("assistant", assistantMessage.getText()));
            }
        }
        return messages;
    }

    private Map<String, String> openAiMessage(String role, String content) {
        Map<String, String> message = new LinkedHashMap<>();
        message.put("role", role);
        message.put("content", content != null ? content : "");
        return message;
    }

    private String parseStreamChunk(String json) {
        try {
            JsonNode node = objectMapper.readTree(json);
            JsonNode delta = node.path("choices").path(0).path("delta").path("content");
            if (delta.isMissingNode() || delta.isNull()) {
                return "";
            }
            return delta.asText("");
        } catch (Exception e) {
            log.debug("[{}] Skip stream chunk: {}", providerName, json);
            return "";
        }
    }

    private String extractCompletionText(JsonNode response) {
        if (response == null) {
            return "";
        }
        JsonNode error = response.get("error");
        if (error != null) {
            throw new IllegalStateException(error.path("message").asText(providerName + " API error"));
        }
        JsonNode content = response.path("choices").path(0).path("message").path("content");
        return content.isMissingNode() || content.isNull() ? "" : content.asText("");
    }

    private ChatResponse toChatResponse(String text) {
        return new ChatResponse(List.of(new Generation(new AssistantMessage(text))));
    }

    private IllegalStateException wrapError(WebClientResponseException e) {
        return new IllegalStateException("[" + providerName + "] " + extractErrorMessage(e), e);
    }

    private String extractErrorMessage(WebClientResponseException e) {
        try {
            JsonNode body = objectMapper.readTree(e.getResponseBodyAsString());
            String message = body.path("error").path("message").asText(null);
            if (message != null && !message.isBlank()) {
                return message;
            }
        } catch (Exception ignored) {
            // fall through
        }
        return e.getMessage();
    }
}
