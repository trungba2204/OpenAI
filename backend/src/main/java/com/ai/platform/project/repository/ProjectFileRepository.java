package com.ai.platform.project.repository;

import com.ai.platform.project.entity.ProjectFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectFileRepository extends JpaRepository<ProjectFile, Long> {
    List<ProjectFile> findByProjectIdOrderByPathAsc(Long projectId);
    Optional<ProjectFile> findByIdAndProjectId(Long id, Long projectId);
    Optional<ProjectFile> findByProjectIdAndPath(Long projectId, String path);
    void deleteByProjectId(Long projectId);
}
