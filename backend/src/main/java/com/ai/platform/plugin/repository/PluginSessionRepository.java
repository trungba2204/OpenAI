package com.ai.platform.plugin.repository;

import com.ai.platform.plugin.entity.PluginSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PluginSessionRepository extends JpaRepository<PluginSession, Long> {

    List<PluginSession> findByUserIdOrderByLastSeenAtDesc(Long userId);
}
