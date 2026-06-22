package com.ai.platform.knowledge.service;

import com.ai.platform.knowledge.entity.*;
import com.ai.platform.knowledge.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class KnowledgeIngestionWorker {

    private final KnowledgeDocumentRepository documentRepository;
    private final KnowledgeChunkRepository chunkRepository;
    private final KnowledgeEmbeddingRepository embeddingRepository;
    private final KnowledgeBaseRepository knowledgeBaseRepository;
    private final DocumentParserService documentParserService;
    private final ChunkingService chunkingService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processDocument(Long documentId) throws Exception {
        KnowledgeDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalStateException("Document not found"));

        doc.setStatus(KnowledgeDocumentStatus.PROCESSING);
        documentRepository.save(doc);

        embeddingRepository.deleteByDocumentId(documentId);
        chunkRepository.deleteByDocumentId(documentId);

        String text = doc.getExtractedText();
        if (text == null || text.isBlank()) {
            text = documentParserService.extractFromPath(Path.of(doc.getFilePath()), doc.getMimeType());
            doc.setExtractedText(text);
        }

        if (text == null || text.isBlank()) {
            doc.setStatus(KnowledgeDocumentStatus.FAILED);
            doc.setErrorMessage("Không trích xuất được nội dung từ tài liệu");
            documentRepository.save(doc);
            return;
        }

        List<String> pieces = chunkingService.chunk(text);
        int index = 0;
        for (String piece : pieces) {
            KnowledgeChunk chunk = chunkRepository.save(KnowledgeChunk.builder()
                    .document(doc)
                    .chunkIndex(index++)
                    .content(piece)
                    .build());

            embeddingRepository.save(KnowledgeEmbedding.builder()
                    .chunk(chunk)
                    .vectorId("chunk:" + chunk.getId())
                    .build());
        }

        doc.setStatus(KnowledgeDocumentStatus.READY);
        doc.setErrorMessage(null);
        documentRepository.save(doc);

        KnowledgeBase kb = doc.getKnowledgeBase();
        if (kb.getStatus() != KnowledgeStatus.ARCHIVED) {
            kb.setStatus(KnowledgeStatus.READY);
            knowledgeBaseRepository.save(kb);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(Long documentId, String message) {
        documentRepository.findById(documentId).ifPresent(doc -> {
            doc.setStatus(KnowledgeDocumentStatus.FAILED);
            doc.setErrorMessage(message);
            documentRepository.save(doc);
        });
    }
}
