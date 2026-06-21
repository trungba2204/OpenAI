package com.ai.platform.ide.repository;

import com.ai.platform.ide.entity.ProjectChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectChunkRepository extends JpaRepository<ProjectChunk, Long> {
    void deleteByProject_Id(Long projectId);

    List<ProjectChunk> findByProjectId(Long projectId);

    @Query("SELECT c FROM ProjectChunk c WHERE c.project.id = :projectId AND (LOWER(c.content) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(c.keywords) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(c.filePath) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<ProjectChunk> search(@Param("projectId") Long projectId, @Param("q") String query);
}
