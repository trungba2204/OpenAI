package com.ai.platform.ide.repository;

import com.ai.platform.ide.entity.IdeAgentRun;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IdeAgentRunRepository extends JpaRepository<IdeAgentRun, Long> {
    List<IdeAgentRun> findByProjectIdOrderByCreatedAtDesc(Long projectId);
}
