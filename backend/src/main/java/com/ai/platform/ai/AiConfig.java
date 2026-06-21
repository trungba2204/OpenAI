package com.ai.platform.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.channel.ChannelOption;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Configuration
@EnableConfigurationProperties(AiProperties.class)
public class AiConfig {

    @Bean
    public WebClient.Builder aiWebClientBuilder() {
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(90))
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 20_000);
        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient));
    }

    @Bean
    @Primary
    public ChatModel chatModel(AiProperties properties, ObjectMapper objectMapper, WebClient.Builder aiWebClientBuilder) {
        List<OpenAiCompatibleChatModel> providers = new ArrayList<>();
        for (Map.Entry<String, AiProviderConfig> entry : properties.getProviders().entrySet()) {
            providers.add(new OpenAiCompatibleChatModel(entry.getKey(), entry.getValue(), objectMapper, aiWebClientBuilder));
        }
        return new FallbackChatModel(providers, properties);
    }
}
