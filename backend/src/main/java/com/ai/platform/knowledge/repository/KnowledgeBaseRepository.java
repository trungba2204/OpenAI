package com.ai.platform.knowledge.repository;

import com.ai.platform.knowledge.entity.KnowledgeBase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface KnowledgeBaseRepository extends JpaRepository<KnowledgeBase, Long> {

    List<KnowledgeBase> findByOwnerIdOrderByUpdatedAtDesc(Long ownerId);

    Optional<KnowledgeBase> findByIdAndOwnerId(Long id, Long ownerId);
}
