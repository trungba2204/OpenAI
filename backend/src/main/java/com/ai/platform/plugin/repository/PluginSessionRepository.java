package com.ai.platform.plugin.repository;

import com.ai.platform.plugin.entity.PluginSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface PluginSessionRepository extends JpaRepository<PluginSession, Long> {

    List<PluginSession> findByUserIdOrderByLastSeenAtDesc(Long userId);

    List<PluginSession> findAllByOrderByLastSeenAtDesc();

    long countByLastSeenAtAfter(LocalDateTime since);
}
