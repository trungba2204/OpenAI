package com.ai.platform.knowledge.repository;

import com.ai.platform.knowledge.entity.KnowledgeEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface KnowledgeEmbeddingRepository extends JpaRepository<KnowledgeEmbedding, Long> {

    @Modifying
    @Query("DELETE FROM KnowledgeEmbedding e WHERE e.chunk.document.id = :documentId")
    void deleteByDocumentId(@Param("documentId") Long documentId);
}
