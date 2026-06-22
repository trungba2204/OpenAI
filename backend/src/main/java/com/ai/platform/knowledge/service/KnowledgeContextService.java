package com.ai.platform.knowledge.service;

import com.ai.platform.knowledge.config.KnowledgeProperties;
import com.ai.platform.knowledge.entity.KnowledgeBase;
import com.ai.platform.knowledge.entity.KnowledgeDocument;
import com.ai.platform.knowledge.entity.KnowledgeDocumentStatus;
import com.ai.platform.knowledge.repository.KnowledgeDocumentRepository;
import com.ai.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KnowledgeContextService {

    private final KnowledgeBaseService knowledgeBaseService;
    private final KnowledgeRetrievalService retrievalService;
    private final KnowledgeDocumentRepository documentRepository;
    private final KnowledgeProperties properties;

    public record RagContext(String systemPrompt, String userContext, List<String> sources) {}

    @Transactional(readOnly = true)
    public RagContext buildContext(User user, Long knowledgeBaseId, String query) {
        KnowledgeBase kb = knowledgeBaseService.getOwned(user, knowledgeBaseId);
        List<KnowledgeDocument> documents = documentRepository.findByKnowledgeBaseIdOrderByUploadedAtDesc(knowledgeBaseId);
        List<KnowledgeRetrievalService.RetrievedChunk> chunks = retrievalService.search(knowledgeBaseId, query);

        Set<String> sources = chunks.stream()
                .map(KnowledgeRetrievalService.RetrievedChunk::fileName)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        String basePrompt = kb.getSystemPrompt() != null && !kb.getSystemPrompt().isBlank()
                ? kb.getSystemPrompt().trim()
                : properties.getDefaultSystemPrompt().trim();

        String systemPrompt = basePrompt + """

                Bạn đang trả lời trong chế độ Knowledge (RAG). Người dùng đã huấn luyện bạn bằng tài liệu riêng.
                Luôn ưu tiên thông tin trong phần "Ngữ cảnh từ tài liệu" bên dưới.
                Nếu ngữ cảnh có nội dung, hãy trả lời dựa trên đó — đừng nói rằng không thấy file.
                """;

        StringBuilder userContext = new StringBuilder();
        userContext.append("Bộ kiến thức: ").append(kb.getName()).append("\n");

        long readyCount = documents.stream()
                .filter(d -> d.getStatus() == KnowledgeDocumentStatus.READY)
                .count();
        if (!documents.isEmpty()) {
            userContext.append("Tài liệu: ");
            userContext.append(documents.stream()
                    .map(d -> d.getFileName() + " (" + d.getStatus() + ")")
                    .collect(Collectors.joining(", ")));
            userContext.append("\n");
        }

        userContext.append("\nNgữ cảnh từ tài liệu đã huấn luyện:\n---\n");

        if (chunks.isEmpty()) {
            if (readyCount == 0 && !documents.isEmpty()) {
                userContext.append("Tài liệu đang được xử lý (chưa READY). Vui lòng đợi vài giây rồi hỏi lại.\n");
            } else if (documents.isEmpty()) {
                userContext.append("Chưa có tài liệu nào trong bộ kiến thức.\n");
            } else {
                userContext.append("Không tìm thấy chunk dữ liệu. Kiểm tra lại quá trình upload/index.\n");
            }
        } else {
            for (KnowledgeRetrievalService.RetrievedChunk chunk : chunks) {
                userContext.append("Nguồn: ").append(chunk.fileName()).append("\n");
                userContext.append(chunk.chunk().getContent()).append("\n---\n");
            }
        }

        userContext.append("\nCâu hỏi: ").append(query);

        return new RagContext(systemPrompt, userContext.toString(), List.copyOf(sources));
    }

    public String formatSourcesFooter(List<String> sources) {
        if (sources == null || sources.isEmpty()) {
            return "";
        }
        return "\n\n---\n**Nguồn:** " + String.join(", ", sources);
    }
}
