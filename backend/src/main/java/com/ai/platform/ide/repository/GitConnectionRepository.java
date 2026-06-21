package com.ai.platform.ide.repository;

import com.ai.platform.ide.entity.GitConnection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GitConnectionRepository extends JpaRepository<GitConnection, Long> {
    Optional<GitConnection> findByProjectId(Long projectId);
}
