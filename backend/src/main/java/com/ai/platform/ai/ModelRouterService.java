package com.ai.platform.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ModelRouterService {

    private final ChatModel chatModel;
    private final AiProperties aiProperties;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    public ChatClient getChatClient(AiModel model) {
        return ChatClient.builder(chatModel)
                .defaultOptions(ChatOptions.builder()
                        .model(model.getModelId())
                        .build())
                .build();
    }

    public String callContent(AiModel model, Prompt prompt) {
        ChatResponse response = chatModel.call(withModel(model, prompt));
        return extractText(response);
    }

    public String callSimple(AiModel model, String system, String user) {
        List<org.springframework.ai.chat.messages.Message> messages = new ArrayList<>();
        if (system != null && !system.isBlank()) {
            messages.add(new SystemMessage(system));
        }
        messages.add(new UserMessage(user));
        return callContent(model, new Prompt(messages));
    }

    public String callWithImages(AiModel model, String system, String userText,
                                 List<ImageAttachment> images) {
        if (images == null || images.isEmpty()) {
            return callSimple(model, system, userText);
        }
        if (model.getProvider() != AiProvider.OPENROUTER) {
            String names = String.join(", ", images.stream().map(ImageAttachment::name).toList());
            String note = "\n\n[Lưu ý: Đính kèm ảnh " + names
                    + " — hãy chọn model OR GPT-4o Mini để phân tích ảnh]";
            return callSimple(model, system, userText + note);
        }
        return callOpenRouterVision(model, system, userText, images);
    }

    private String callOpenRouterVision(AiModel model, String system, String userText,
                                        List<ImageAttachment> images) {
        AiProviderConfig config = aiProperties.getProviders().get("openrouter");
        if (config == null || config.getApiKey() == null || config.getApiKey().isBlank()) {
            return callSimple(model, system, userText);
        }
        WebClient client = webClientBuilder.clone()
                .baseUrl(config.getBaseUrl())
                .defaultHeader("Authorization", "Bearer " + config.getApiKey())
                .build();

        List<Map<String, Object>> content = new ArrayList<>();
        content.add(Map.of("type", "text", "text", userText != null ? userText : ""));
        for (ImageAttachment img : images) {
            String dataUrl = "data:" + img.mimeType() + ";base64," + img.base64();
            content.add(Map.of(
                    "type", "image_url",
                    "image_url", Map.of("url", dataUrl)
            ));
        }

        List<Map<String, Object>> messages = new ArrayList<>();
        if (system != null && !system.isBlank()) {
            messages.add(Map.of("role", "system", "content", system));
        }
        messages.add(Map.of("role", "user", "content", content));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model.getModelId());
        body.put("messages", messages);
        body.put("stream", false);

        try {
            JsonNode response = client.post()
                    .uri(config.getCompletionsPath())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();
            if (response == null) return "";
            JsonNode err = response.get("error");
            if (err != null) {
                throw new IllegalStateException(err.path("message").asText("Vision API error"));
            }
            return response.path("choices").path(0).path("message").path("content").asText("");
        } catch (Exception e) {
            throw new IllegalStateException("Vision call failed: " + e.getMessage(), e);
        }
    }

    public record ImageAttachment(String name, String mimeType, String base64) {}

    public Flux<String> streamContent(AiModel model, Prompt prompt) {
        return chatModel.stream(withModel(model, prompt))
                .mapNotNull(this::extractText)
                .filter(text -> !text.isEmpty());
    }

    private Prompt withModel(AiModel model, Prompt prompt) {
        return new Prompt(
                prompt.getInstructions(),
                ChatOptions.builder().model(model.getModelId()).build()
        );
    }

    private String extractText(ChatResponse response) {
        if (response == null || response.getResult() == null || response.getResult().getOutput() == null) {
            return null;
        }
        String text = response.getResult().getOutput().getText();
        return (text == null || text.isBlank()) ? null : text;
    }
}
