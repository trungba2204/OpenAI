package com.ai.platform.knowledge.repository;

import com.ai.platform.knowledge.entity.KnowledgeChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface KnowledgeChunkRepository extends JpaRepository<KnowledgeChunk, Long> {

    void deleteByDocumentId(Long documentId);

    @Query("""
            SELECT c FROM KnowledgeChunk c
            JOIN FETCH c.document d
            WHERE d.knowledgeBase.id = :kbId
            ORDER BY d.id ASC, c.chunkIndex ASC
            """)
    List<KnowledgeChunk> findByKnowledgeBaseId(@Param("kbId") Long knowledgeBaseId);

    long countByDocumentKnowledgeBaseId(Long knowledgeBaseId);
}
