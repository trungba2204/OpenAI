package com.ai.platform.agent.service;

import com.ai.platform.agent.dto.AgentChatRequest;
import com.ai.platform.agent.dto.AgentRunDto;
import com.ai.platform.agent.entity.AgentRun;
import com.ai.platform.agent.repository.AgentRunRepository;
import com.ai.platform.agent.tool.UserAgentTools;
import com.ai.platform.ai.AiModel;
import com.ai.platform.ai.ModelRouterService;
import com.ai.platform.chat.entity.Conversation;
import com.ai.platform.chat.entity.Message;
import com.ai.platform.chat.repository.ConversationRepository;
import com.ai.platform.chat.repository.MessageRepository;
import com.ai.platform.common.exception.ApiException;
import com.ai.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AgentService {

    private final ModelRouterService modelRouterService;
    private final UserAgentTools userAgentTools;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final AgentRunRepository agentRunRepository;

    @Transactional
    public String agentChat(User user, AgentChatRequest request) {
        Conversation conversation = resolveConversation(user, request);

        Message userMessage = Message.builder()
                .conversation(conversation)
                .role("user")
                .content(request.getContent())
                .build();
        messageRepository.save(userMessage);

        AiModel model = request.getModel() != null ? request.getModel() : conversation.getModel();
        ChatClient chatClient = modelRouterService.getChatClient(model);

        userAgentTools.setUserId(user.getId());
        try {
            var toolProvider = MethodToolCallbackProvider.builder()
                    .toolObjects(userAgentTools)
                    .build();

            String response = chatClient.prompt()
                    .system("""
                            Bạn là AI Agent thông minh. Bạn có thể sử dụng các công cụ để truy vấn database,
                            gọi API, hoặc đọc file spreadsheet. Hãy phân tích yêu cầu và sử dụng công cụ phù hợp.
                            Trả lời bằng tiếng Việt.""")
                    .user(request.getContent())
                    .toolCallbacks(toolProvider)
                    .call()
                    .content();

            Message assistantMessage = Message.builder()
                    .conversation(conversation)
                    .role("assistant")
                    .content(response)
                    .build();
            messageRepository.save(assistantMessage);

            return response;
        } finally {
            userAgentTools.clearUserId();
        }
    }

    @Transactional(readOnly = true)
    public List<AgentRunDto> getAgentRuns(User user) {
        return agentRunRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private Conversation resolveConversation(User user, AgentChatRequest request) {
        if (request.getConversationId() != null) {
            return conversationRepository.findByIdAndUserId(request.getConversationId(), user.getId())
                    .orElseThrow(() -> new ApiException("Conversation not found", HttpStatus.NOT_FOUND));
        }
        Conversation conversation = Conversation.builder()
                .user(user)
                .title("Agent Chat")
                .model(request.getModel() != null ? request.getModel() : AiModel.GROQ_LLAMA_70B)
                .build();
        return conversationRepository.save(conversation);
    }

    private AgentRunDto toDto(AgentRun run) {
        return AgentRunDto.builder()
                .id(run.getId())
                .toolName(run.getToolName())
                .input(run.getInput())
                .output(run.getOutput())
                .createdAt(run.getCreatedAt())
                .build();
    }
}
