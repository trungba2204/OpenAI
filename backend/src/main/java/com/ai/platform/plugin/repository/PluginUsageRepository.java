package com.ai.platform.plugin.repository;

import com.ai.platform.plugin.entity.PluginUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PluginUsageRepository extends JpaRepository<PluginUsage, Long>, JpaSpecificationExecutor<PluginUsage> {

    List<PluginUsage> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT COALESCE(SUM(u.tokens), 0) FROM PluginUsage u WHERE u.user.id = :userId")
    long sumTokensByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(u) FROM PluginUsage u WHERE u.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(u.tokens), 0) FROM PluginUsage u")
    long sumTotalTokens();

    @Query("SELECT u.editorType, COUNT(u) FROM PluginUsage u GROUP BY u.editorType")
    List<Object[]> countGroupByEditorType();

    @Query("SELECT u.endpoint, COUNT(u) FROM PluginUsage u GROUP BY u.endpoint")
    List<Object[]> countGroupByEndpoint();
}
