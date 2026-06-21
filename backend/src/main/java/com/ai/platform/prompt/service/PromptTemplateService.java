package com.ai.platform.prompt.service;

import com.ai.platform.common.exception.ApiException;
import com.ai.platform.prompt.dto.PromptTemplateDto;
import com.ai.platform.prompt.dto.PromptTemplateRequest;
import com.ai.platform.prompt.entity.PromptTemplate;
import com.ai.platform.prompt.repository.PromptTemplateRepository;
import com.ai.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PromptTemplateService {

    private final PromptTemplateRepository promptTemplateRepository;

    @Transactional(readOnly = true)
    public List<PromptTemplateDto> listAccessible(User user) {
        return promptTemplateRepository.findAccessibleByUser(user.getId())
                .stream()
                .map(p -> toDto(p, user.getId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public PromptTemplateDto create(User user, PromptTemplateRequest request) {
        PromptTemplate template = PromptTemplate.builder()
                .user(user)
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory() != null ? request.getCategory() : "GENERAL")
                .isPublic(request.isPublic())
                .build();
        return toDto(promptTemplateRepository.save(template), user.getId());
    }

    @Transactional
    public PromptTemplateDto update(User user, Long id, PromptTemplateRequest request) {
        PromptTemplate template = promptTemplateRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ApiException("Prompt not found", HttpStatus.NOT_FOUND));
        template.setTitle(request.getTitle());
        template.setContent(request.getContent());
        template.setCategory(request.getCategory());
        template.setPublic(request.isPublic());
        return toDto(promptTemplateRepository.save(template), user.getId());
    }

    @Transactional
    public void delete(User user, Long id) {
        PromptTemplate template = promptTemplateRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ApiException("Prompt not found", HttpStatus.NOT_FOUND));
        promptTemplateRepository.delete(template);
    }

    private PromptTemplateDto toDto(PromptTemplate p, Long userId) {
        return PromptTemplateDto.builder()
                .id(p.getId())
                .title(p.getTitle())
                .content(p.getContent())
                .category(p.getCategory())
                .isPublic(p.isPublic())
                .owned(p.getUser() != null && p.getUser().getId().equals(userId))
                .createdAt(p.getCreatedAt())
                .build();
    }
}
