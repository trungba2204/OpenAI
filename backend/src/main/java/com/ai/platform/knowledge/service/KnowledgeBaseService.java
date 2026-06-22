package com.ai.platform.knowledge.service;

import com.ai.platform.common.exception.ApiException;
import com.ai.platform.knowledge.dto.KnowledgeBaseDto;
import com.ai.platform.knowledge.dto.KnowledgeBaseRequest;
import com.ai.platform.knowledge.entity.KnowledgeBase;
import com.ai.platform.knowledge.entity.KnowledgeStatus;
import com.ai.platform.knowledge.repository.KnowledgeBaseRepository;
import com.ai.platform.knowledge.repository.KnowledgeDocumentRepository;
import com.ai.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KnowledgeBaseService {

    private final KnowledgeBaseRepository knowledgeBaseRepository;
    private final KnowledgeDocumentRepository documentRepository;

    @Transactional(readOnly = true)
    public List<KnowledgeBaseDto> list(User user) {
        return knowledgeBaseRepository.findByOwnerIdOrderByUpdatedAtDesc(user.getId())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public KnowledgeBaseDto get(User user, Long id) {
        return toDto(getOwned(user, id));
    }

    @Transactional
    public KnowledgeBaseDto create(User user, KnowledgeBaseRequest request) {
        KnowledgeBase kb = KnowledgeBase.builder()
                .owner(user)
                .name(request.getName().trim())
                .description(trim(request.getDescription()))
                .systemPrompt(trim(request.getSystemPrompt()))
                .persona(trim(request.getPersona()))
                .status(KnowledgeStatus.DRAFT)
                .build();
        return toDto(knowledgeBaseRepository.save(kb));
    }

    @Transactional
    public KnowledgeBaseDto update(User user, Long id, KnowledgeBaseRequest request) {
        KnowledgeBase kb = getOwned(user, id);
        kb.setName(request.getName().trim());
        kb.setDescription(trim(request.getDescription()));
        if (request.getSystemPrompt() != null) {
            kb.setSystemPrompt(trim(request.getSystemPrompt()));
        }
        kb.setPersona(trim(request.getPersona()));
        return toDto(knowledgeBaseRepository.save(kb));
    }

    @Transactional
    public KnowledgeBaseDto updatePrompt(User user, Long id, String systemPrompt) {
        KnowledgeBase kb = getOwned(user, id);
        kb.setSystemPrompt(systemPrompt.trim());
        return toDto(knowledgeBaseRepository.save(kb));
    }

    @Transactional
    public void delete(User user, Long id) {
        KnowledgeBase kb = getOwned(user, id);
        knowledgeBaseRepository.delete(kb);
    }

    public KnowledgeBase getOwned(User user, Long id) {
        return knowledgeBaseRepository.findByIdAndOwnerId(id, user.getId())
                .orElseThrow(() -> new ApiException("Knowledge base not found", HttpStatus.NOT_FOUND));
    }

    private KnowledgeBaseDto toDto(KnowledgeBase kb) {
        return KnowledgeBaseDto.builder()
                .id(kb.getId())
                .name(kb.getName())
                .description(kb.getDescription())
                .systemPrompt(kb.getSystemPrompt())
                .persona(kb.getPersona())
                .status(kb.getStatus())
                .documentCount(documentRepository.countByKnowledgeBaseId(kb.getId()))
                .createdAt(kb.getCreatedAt())
                .updatedAt(kb.getUpdatedAt())
                .build();
    }

    private String trim(String value) {
        if (value == null) return null;
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }
}
