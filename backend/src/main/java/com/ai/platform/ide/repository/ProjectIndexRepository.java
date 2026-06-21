package com.ai.platform.ide.repository;

import com.ai.platform.ide.entity.ProjectIndex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectIndexRepository extends JpaRepository<ProjectIndex, Long> {
    void deleteByProject_Id(Long projectId);

    List<ProjectIndex> findByProjectId(Long projectId);

    @Query("SELECT i FROM ProjectIndex i WHERE i.project.id = :projectId AND (LOWER(i.symbolName) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(i.filePath) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(i.signature) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<ProjectIndex> search(@Param("projectId") Long projectId, @Param("q") String query);
}
