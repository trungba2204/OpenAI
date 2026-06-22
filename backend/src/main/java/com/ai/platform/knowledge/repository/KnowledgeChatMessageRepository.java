package com.ai.platform.knowledge.repository;

import com.ai.platform.knowledge.entity.KnowledgeChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KnowledgeChatMessageRepository extends JpaRepository<KnowledgeChatMessage, Long> {
}
