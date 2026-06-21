package com.ai.platform.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ModelRouterService {

    private final ChatModel chatModel;

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
