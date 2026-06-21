package com.ai.platform.prompt.repository;

import com.ai.platform.prompt.entity.PromptTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PromptTemplateRepository extends JpaRepository<PromptTemplate, Long> {

    @Query("SELECT p FROM PromptTemplate p WHERE p.isPublic = true OR p.user.id = :userId ORDER BY p.createdAt DESC")
    List<PromptTemplate> findAccessibleByUser(Long userId);

    Optional<PromptTemplate> findByIdAndUserId(Long id, Long userId);
}
