package com.ai.platform.plugin.repository;

import com.ai.platform.plugin.entity.PluginInstallation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PluginInstallationRepository extends JpaRepository<PluginInstallation, Long> {

    List<PluginInstallation> findByUserIdOrderByInstalledAtDesc(Long userId);

    List<PluginInstallation> findAllByOrderByInstalledAtDesc();
}
