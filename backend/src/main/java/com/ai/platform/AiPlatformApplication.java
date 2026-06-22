package com.ai.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.boot.context.properties.EnableConfigurationProperties(
        com.ai.platform.knowledge.config.KnowledgeProperties.class
)
public class AiPlatformApplication {

	public static void main(String[] args) {
		SpringApplication.run(AiPlatformApplication.class, args);
	}
}
