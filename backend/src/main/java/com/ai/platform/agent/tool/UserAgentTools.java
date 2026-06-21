package com.ai.platform.agent.tool;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserAgentTools {

    private final AgentTools agentTools;
    private final ThreadLocal<Long> userIdHolder = new ThreadLocal<>();

    public void setUserId(Long userId) {
        userIdHolder.set(userId);
    }

    public void clearUserId() {
        userIdHolder.remove();
    }

    @org.springframework.ai.tool.annotation.Tool(description = "Truy vấn database SELECT an toàn")
    public String queryDatabase(String sql) {
        return agentTools.queryDatabase(sql, userIdHolder.get());
    }

    @org.springframework.ai.tool.annotation.Tool(description = "Gọi REST API bên ngoài")
    public String callApi(String url) {
        return agentTools.callApi(url);
    }

    @org.springframework.ai.tool.annotation.Tool(description = "Đọc nội dung file Excel/CSV đã upload")
    public String readSpreadsheet(Long docId) {
        return agentTools.readSpreadsheet(docId, userIdHolder.get());
    }
}
