package com.ai.platform.chat.repository;

import com.ai.platform.chat.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByUserIdOrderByUpdatedAtDesc(Long userId);
    Optional<Conversation> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT c FROM Conversation c LEFT JOIN FETCH c.documents WHERE c.id = :id AND c.user.id = :userId")
    Optional<Conversation> findByIdAndUserIdWithDocuments(Long id, Long userId);
}
