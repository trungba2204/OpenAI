package com.ai.platform.common.repository;

import com.ai.platform.common.entity.GeneratedFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GeneratedFileRepository extends JpaRepository<GeneratedFile, Long> {
    Optional<GeneratedFile> findByIdAndUserId(Long id, Long userId);
}
