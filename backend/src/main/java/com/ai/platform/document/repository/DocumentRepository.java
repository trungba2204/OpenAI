package com.ai.platform.document.repository;

import com.ai.platform.document.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Document> findByIdAndUserId(Long id, Long userId);
}
