package com.ai.platform.knowledge.repository;

import com.ai.platform.knowledge.entity.KnowledgeDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface KnowledgeDocumentRepository extends JpaRepository<KnowledgeDocument, Long> {

    List<KnowledgeDocument> findByKnowledgeBaseIdOrderByUploadedAtDesc(Long knowledgeBaseId);

    Optional<KnowledgeDocument> findByIdAndKnowledgeBaseId(Long id, Long knowledgeBaseId);

    long countByKnowledgeBaseId(Long knowledgeBaseId);
}
