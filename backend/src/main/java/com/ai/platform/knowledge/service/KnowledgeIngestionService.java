package com.ai.platform.knowledge.service;

import com.ai.platform.knowledge.service.KnowledgeIngestionWorker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KnowledgeIngestionService {

    private final KnowledgeIngestionWorker worker;

    @Async
    public void processDocumentAsync(Long documentId) {
        try {
            worker.processDocument(documentId);
        } catch (Exception e) {
            log.error("Knowledge ingestion failed for document {}", documentId, e);
            worker.markFailed(documentId, truncate(e.getMessage(), 1900));
        }
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
