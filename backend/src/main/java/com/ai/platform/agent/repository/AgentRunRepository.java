package com.ai.platform.agent.repository;

import com.ai.platform.agent.entity.AgentRun;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AgentRunRepository extends JpaRepository<AgentRun, Long> {
    List<AgentRun> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<AgentRun> findByConversationIdOrderByCreatedAtAsc(Long conversationId);
}
