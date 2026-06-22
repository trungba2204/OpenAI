package com.ai.platform.knowledge.service;

import com.ai.platform.ai.AiModel;
import com.ai.platform.ai.ModelRouterService;
import com.ai.platform.common.exception.ApiException;
import com.ai.platform.knowledge.config.KnowledgeProperties;
import com.ai.platform.knowledge.dto.KnowledgeChatRequest;
import com.ai.platform.knowledge.dto.KnowledgeChatResponse;
import com.ai.platform.knowledge.entity.KnowledgeBase;
import com.ai.platform.knowledge.entity.KnowledgeChatMessage;
import com.ai.platform.knowledge.entity.KnowledgeChatSession;
import com.ai.platform.knowledge.repository.KnowledgeChatMessageRepository;
import com.ai.platform.knowledge.repository.KnowledgeChatSessionRepository;
import com.ai.platform.user.entity.User;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KnowledgeRagService {

    private final KnowledgeBaseService knowledgeBaseService;
    private final KnowledgeRetrievalService retrievalService;
    private final KnowledgeChatSessionRepository sessionRepository;
    private final KnowledgeChatMessageRepository messageRepository;
    private final ModelRouterService modelRouterService;
    private final KnowledgeProperties properties;
    private final ObjectMapper objectMapper;

    @Transactional
    public KnowledgeChatResponse chat(User user, Long knowledgeBaseId, KnowledgeChatRequest request) {
        KnowledgeBase kb = knowledgeBaseService.getOwned(user, knowledgeBaseId);

        KnowledgeChatSession session;
        if (request.getSessionId() != null) {
            session = sessionRepository.findByIdAndUserId(request.getSessionId(), user.getId())
                    .orElseThrow(() -> new ApiException("Session not found", HttpStatus.NOT_FOUND));
            if (!session.getKnowledgeBase().getId().equals(knowledgeBaseId)) {
                throw new ApiException("Session not found", HttpStatus.NOT_FOUND);
            }
        } else {
            session = sessionRepository.save(KnowledgeChatSession.builder()
                    .knowledgeBase(kb)
                    .user(user)
                    .title(truncate(request.getMessage(), 120))
                    .build());
        }

        messageRepository.save(KnowledgeChatMessage.builder()
                .session(session)
                .role("user")
                .content(request.getMessage())
                .build());

        List<KnowledgeRetrievalService.RetrievedChunk> chunks =
                retrievalService.search(knowledgeBaseId, request.getMessage());

        Set<String> sources = chunks.stream()
                .map(KnowledgeRetrievalService.RetrievedChunk::fileName)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        String systemPrompt = buildSystemPrompt(kb);
        String userPrompt = buildUserPrompt(request.getMessage(), chunks);

        String answer = modelRouterService.callSimple(AiModel.GROQ_LLAMA_70B, systemPrompt, userPrompt);
        if (answer == null || answer.isBlank()) {
            answer = "Tôi không tìm thấy dữ liệu phù hợp.";
        }

        String sourcesJson = writeSources(sources);
        messageRepository.save(KnowledgeChatMessage.builder()
                .session(session)
                .role("assistant")
                .content(answer)
                .sourcesJson(sourcesJson)
                .build());

        return KnowledgeChatResponse.builder()
                .answer(answer)
                .sources(List.copyOf(sources))
                .sessionId(session.getId())
                .build();
    }

    private String buildSystemPrompt(KnowledgeBase kb) {
        if (kb.getSystemPrompt() != null && !kb.getSystemPrompt().isBlank()) {
            return kb.getSystemPrompt().trim();
        }
        return properties.getDefaultSystemPrompt().trim();
    }

    private String buildUserPrompt(String question, List<KnowledgeRetrievalService.RetrievedChunk> chunks) {
        StringBuilder sb = new StringBuilder();
        sb.append("Ngữ cảnh từ tài liệu đã huấn luyện:\n---\n");
        if (chunks.isEmpty()) {
            sb.append("(Không có đoạn văn liên quan)\n");
        } else {
            for (KnowledgeRetrievalService.RetrievedChunk chunk : chunks) {
                sb.append("Nguồn: ").append(chunk.fileName()).append("\n");
                sb.append(chunk.chunk().getContent()).append("\n---\n");
            }
        }
        sb.append("\nCâu hỏi: ").append(question);
        return sb.toString();
    }

    private String writeSources(Set<String> sources) {
        try {
            return objectMapper.writeValueAsString(sources);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
