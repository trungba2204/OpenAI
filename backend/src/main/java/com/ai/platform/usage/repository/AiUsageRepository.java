package com.ai.platform.usage.repository;

import com.ai.platform.usage.entity.AiUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface AiUsageRepository extends JpaRepository<AiUsage, Long>, JpaSpecificationExecutor<AiUsage> {

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    @Query("SELECT COALESCE(SUM(u.totalTokens), 0) FROM AiUsage u")
    long sumTotalTokens();

    @Query("SELECT COALESCE(SUM(u.estimatedCost), 0) FROM AiUsage u")
    BigDecimal sumTotalCost();

    @Query("SELECT COALESCE(SUM(u.estimatedCost), 0) FROM AiUsage u WHERE u.createdAt >= :from AND u.createdAt < :to")
    BigDecimal sumCostBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COALESCE(SUM(u.totalTokens), 0) FROM AiUsage u WHERE u.user.id = :userId")
    long sumTokensByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(u) FROM AiUsage u WHERE u.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);

    @Query("""
            SELECT u.modelName, COUNT(u)
            FROM AiUsage u
            GROUP BY u.modelName
            ORDER BY COUNT(u) DESC
            """)
    List<Object[]> countByModel();

    @Query(value = """
            SELECT DATE(created_at) AS day, COALESCE(SUM(total_tokens), 0)
            FROM ai_usage
            WHERE created_at >= :from
            GROUP BY DATE(created_at)
            ORDER BY day
            """, nativeQuery = true)
    List<Object[]> tokensPerDay(@Param("from") LocalDateTime from);

    @Query(value = """
            SELECT DATE(created_at) AS day, COALESCE(SUM(estimated_cost), 0)
            FROM ai_usage
            WHERE created_at >= :from
            GROUP BY DATE(created_at)
            ORDER BY day
            """, nativeQuery = true)
    List<Object[]> costPerDay(@Param("from") LocalDateTime from);

    @Query("""
            SELECT u.user.id, u.user.email, COALESCE(SUM(u.totalTokens), 0)
            FROM AiUsage u
            GROUP BY u.user.id, u.user.email
            ORDER BY SUM(u.totalTokens) DESC
            """)
    List<Object[]> tokensPerUser();

    @Query("""
            SELECT u.modelName, COALESCE(SUM(u.totalTokens), 0)
            FROM AiUsage u
            GROUP BY u.modelName
            ORDER BY SUM(u.totalTokens) DESC
            """)
    List<Object[]> tokensPerModel();
}
