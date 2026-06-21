package com.ai.platform.admin.service;

import com.ai.platform.admin.dto.*;
import com.ai.platform.audit.service.AuditLogService;
import com.ai.platform.chat.entity.Conversation;
import com.ai.platform.chat.entity.Message;
import com.ai.platform.chat.repository.ConversationRepository;
import com.ai.platform.chat.repository.MessageRepository;
import com.ai.platform.common.exception.ApiException;
import com.ai.platform.usage.entity.AiUsage;
import com.ai.platform.usage.repository.AiUsageRepository;
import com.ai.platform.user.entity.User;
import com.ai.platform.user.entity.UserStatus;
import com.ai.platform.user.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final AiUsageRepository aiUsageRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public AdminDashboardDto getDashboard() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime endOfToday = startOfToday.plusDays(1);

        long activeToday = aiUsageRepository.findAll().stream()
                .filter(u -> !u.getCreatedAt().isBefore(startOfToday) && u.getCreatedAt().isBefore(endOfToday))
                .map(u -> u.getUser().getId())
                .distinct()
                .count();

        return AdminDashboardDto.builder()
                .totalUsers(userRepository.count())
                .totalChats(conversationRepository.count())
                .totalRequests(aiUsageRepository.count())
                .totalTokens(aiUsageRepository.sumTotalTokens())
                .totalCost(aiUsageRepository.sumTotalCost())
                .activeUsersToday(activeToday)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminUserDto> getUsers() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(this::toAdminUserDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminUserDto getUser(Long id) {
        User user = getUserOrThrow(id);
        return toAdminUserDto(user);
    }

    @Transactional
    public AdminUserDto lockUser(User actor, Long id, String ip) {
        User user = getUserOrThrow(id);
        user.setStatus(UserStatus.LOCKED);
        userRepository.save(user);
        auditLogService.log(actor, "LOCK_USER", "user:" + id, ip);
        return toAdminUserDto(user);
    }

    @Transactional
    public AdminUserDto unlockUser(User actor, Long id, String ip) {
        User user = getUserOrThrow(id);
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
        auditLogService.log(actor, "UNLOCK_USER", "user:" + id, ip);
        return toAdminUserDto(user);
    }

    @Transactional(readOnly = true)
    public List<AdminUsageDto> getUsages(String model, Long userId, LocalDate from, LocalDate to) {
        Specification<AiUsage> spec = buildUsageSpec(model, userId, from, to);
        return aiUsageRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(this::toUsageDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminUsageDto getUsage(Long id) {
        AiUsage usage = aiUsageRepository.findById(id)
                .orElseThrow(() -> new ApiException("Usage not found", HttpStatus.NOT_FOUND));
        return toUsageDto(usage);
    }

    @Transactional(readOnly = true)
    public List<AdminConversationDto> getConversations(String keyword) {
        List<Conversation> conversations = conversationRepository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt"));
        return conversations.stream()
                .map(this::toConversationDto)
                .filter(dto -> matchesKeyword(dto, keyword))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminConversationDto getConversation(Long id) {
        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new ApiException("Conversation not found", HttpStatus.NOT_FOUND));
        return toConversationDto(conversation);
    }

    @Transactional(readOnly = true)
    public List<ModelStatisticDto> getModelStatistics() {
        return aiUsageRepository.countByModel().stream()
                .map(row -> ModelStatisticDto.builder()
                        .model((String) row[0])
                        .requests(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TokenAnalyticsDto getTokenAnalytics() {
        LocalDateTime from = LocalDate.now().minusDays(30).atStartOfDay();

        List<SeriesPointDto> perDay = aiUsageRepository.tokensPerDay(from).stream()
                .map(row -> SeriesPointDto.builder()
                        .label(String.valueOf(row[0]))
                        .value(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        List<LabelValueDto> perModel = aiUsageRepository.tokensPerModel().stream()
                .map(row -> LabelValueDto.builder()
                        .label((String) row[0])
                        .value(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        List<LabelValueDto> perUser = aiUsageRepository.tokensPerUser().stream()
                .limit(20)
                .map(row -> LabelValueDto.builder()
                        .label((String) row[1])
                        .value(((Number) row[2]).longValue())
                        .build())
                .collect(Collectors.toList());

        return TokenAnalyticsDto.builder()
                .tokensPerDay(perDay)
                .tokensPerModel(perModel)
                .tokensPerUser(perUser)
                .build();
    }

    @Transactional(readOnly = true)
    public CostAnalyticsDto getCostAnalytics() {
        LocalDate today = LocalDate.now();
        LocalDateTime startToday = today.atStartOfDay();
        LocalDateTime startMonth = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime startYear = today.withDayOfYear(1).atStartOfDay();
        LocalDateTime startChart = today.minusDays(30).atStartOfDay();

        List<DecimalSeriesPointDto> costPerDay = aiUsageRepository.costPerDay(startChart).stream()
                .map(row -> DecimalSeriesPointDto.builder()
                        .label(String.valueOf(row[0]))
                        .value(new BigDecimal(String.valueOf(row[1])))
                        .build())
                .collect(Collectors.toList());

        return CostAnalyticsDto.builder()
                .today(aiUsageRepository.sumCostBetween(startToday, startToday.plusDays(1)))
                .month(aiUsageRepository.sumCostBetween(startMonth, startToday.plusDays(1)))
                .year(aiUsageRepository.sumCostBetween(startYear, startToday.plusDays(1)))
                .costPerDay(costPerDay)
                .build();
    }

    private User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
    }

    private AdminUserDto toAdminUserDto(User user) {
        return AdminUserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .status(user.getStatus())
                .totalRequests(aiUsageRepository.countByUserId(user.getId()))
                .totalTokens(aiUsageRepository.sumTokensByUserId(user.getId()))
                .createdAt(user.getCreatedAt())
                .build();
    }

    private AdminUsageDto toUsageDto(AiUsage usage) {
        return AdminUsageDto.builder()
                .id(usage.getId())
                .userId(usage.getUser().getId())
                .userEmail(usage.getUser().getEmail())
                .conversationId(usage.getConversation() != null ? usage.getConversation().getId() : null)
                .model(usage.getModelName())
                .prompt(usage.getPrompt())
                .response(usage.getResponse())
                .inputTokens(usage.getInputTokens())
                .outputTokens(usage.getOutputTokens())
                .totalTokens(usage.getTotalTokens())
                .cost(usage.getEstimatedCost())
                .createdAt(usage.getCreatedAt())
                .build();
    }

    private AdminConversationDto toConversationDto(Conversation conversation) {
        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
        String question = messages.stream()
                .filter(m -> "user".equalsIgnoreCase(m.getRole()))
                .map(Message::getContent)
                .reduce((first, second) -> second)
                .orElse("");
        String answer = messages.stream()
                .filter(m -> "assistant".equalsIgnoreCase(m.getRole()))
                .map(Message::getContent)
                .reduce((first, second) -> second)
                .orElse("");

        long tokens = aiUsageRepository.findAll().stream()
                .filter(u -> u.getConversation() != null && u.getConversation().getId().equals(conversation.getId()))
                .mapToLong(AiUsage::getTotalTokens)
                .sum();

        return AdminConversationDto.builder()
                .id(conversation.getId())
                .userId(conversation.getUser().getId())
                .userEmail(conversation.getUser().getEmail())
                .title(conversation.getTitle())
                .question(question)
                .answer(answer)
                .model(conversation.getModel().name())
                .tokens(tokens)
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();
    }

    private boolean matchesKeyword(AdminConversationDto dto, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }
        String k = keyword.toLowerCase();
        return contains(dto.getTitle(), k)
                || contains(dto.getQuestion(), k)
                || contains(dto.getAnswer(), k)
                || contains(dto.getUserEmail(), k);
    }

    private boolean contains(String value, String keyword) {
        return value != null && value.toLowerCase().contains(keyword);
    }

    private Specification<AiUsage> buildUsageSpec(String model, Long userId, LocalDate from, LocalDate to) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (model != null && !model.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("modelName")), "%" + model.toLowerCase() + "%"));
            }
            if (userId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), userId));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay()));
            }
            if (to != null) {
                predicates.add(cb.lessThan(root.get("createdAt"), to.plusDays(1).atStartOfDay()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
