package com.ai.platform.knowledge.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app.knowledge")
public class KnowledgeProperties {

    private int chunkSize = 800;
    private int chunkOverlap = 120;
    private int topK = 5;
    private String defaultSystemPrompt = """
            Bạn là AI assistant được huấn luyện từ tài liệu của người dùng.
            Chỉ trả lời dựa trên dữ liệu đã huấn luyện trong ngữ cảnh được cung cấp.
            Nếu không có thông tin phù hợp, hãy trả lời: "Tôi không tìm thấy dữ liệu phù hợp."
            """;
}
