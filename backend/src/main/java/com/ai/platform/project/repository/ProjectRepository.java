package com.ai.platform.project.repository;

import com.ai.platform.project.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByWorkspaceIdOrderByUpdatedAtDesc(Long workspaceId);
    Optional<Project> findByIdAndUserId(Long id, Long userId);
    List<Project> findByUserIdOrderByUpdatedAtDesc(Long userId);
}
