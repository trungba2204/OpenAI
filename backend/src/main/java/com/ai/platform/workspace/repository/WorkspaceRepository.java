package com.ai.platform.workspace.repository;

import com.ai.platform.workspace.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    List<Workspace> findByUserIdOrderByUpdatedAtDesc(Long userId);
    Optional<Workspace> findByIdAndUserId(Long id, Long userId);
}
