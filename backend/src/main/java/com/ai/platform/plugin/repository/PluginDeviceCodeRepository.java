package com.ai.platform.plugin.repository;

import com.ai.platform.plugin.entity.PluginDeviceCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PluginDeviceCodeRepository extends JpaRepository<PluginDeviceCode, Long> {

    Optional<PluginDeviceCode> findByCodeAndConsumedFalse(String code);
}
