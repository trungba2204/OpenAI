package com.ai.platform.knowledge.repository;

import com.ai.platform.knowledge.entity.KnowledgeChatSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface KnowledgeChatSessionRepository extends JpaRepository<KnowledgeChatSession, Long> {

    Optional<KnowledgeChatSession> findByIdAndUserId(Long id, Long userId);
}
