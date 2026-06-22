package com.ai.platform.admin.service;

import com.ai.platform.admin.dto.*;
import com.ai.platform.plugin.entity.PluginEditorType;
import com.ai.platform.plugin.entity.PluginInstallation;
import com.ai.platform.plugin.entity.PluginSession;
import com.ai.platform.plugin.entity.PluginUsage;
import com.ai.platform.plugin.repository.PluginInstallationRepository;
import com.ai.platform.plugin.repository.PluginSessionRepository;
import com.ai.platform.plugin.repository.PluginUsageRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminPluginService {

    private final PluginUsageRepository usageRepository;
    private final PluginSessionRepository sessionRepository;
    private final PluginInstallationRepository installationRepository;

    @Transactional(readOnly = true)
    public AdminPluginDashboardDto getDashboard() {
        LocalDateTime since24h = LocalDateTime.now().minusHours(24);
        List<SeriesPointDto> perDay = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = 29; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            LocalDateTime start = d.atStartOfDay();
            LocalDateTime end = d.plusDays(1).atStartOfDay();
            long count = usageRepository.findAll().stream()
                    .filter(u -> !u.getCreatedAt().isBefore(start) && u.getCreatedAt().isBefore(end))
                    .count();
            perDay.add(SeriesPointDto.builder().label(d.toString()).value(count).build());
        }

        return AdminPluginDashboardDto.builder()
                .totalInstallations(installationRepository.count())
                .activeSessions(sessionRepository.countByLastSeenAtAfter(since24h))
                .totalRequests(usageRepository.count())
                .totalTokens(usageRepository.sumTotalTokens())
                .requestsByEditor(toLabelValues(usageRepository.countGroupByEditorType()))
                .requestsByEndpoint(toLabelValues(usageRepository.countGroupByEndpoint()))
                .requestsPerDay(perDay)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminPluginUsageDto> getUsages(String editorType, Long userId, String endpoint,
                                                LocalDate from, LocalDate to) {
        Specification<PluginUsage> spec = buildUsageSpec(editorType, userId, endpoint, from, to);
        return usageRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(this::toUsageDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdminPluginSessionDto> getSessions() {
        return sessionRepository.findAllByOrderByLastSeenAtDesc().stream()
                .map(this::toSessionDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdminPluginInstallationDto> getInstallations() {
        return installationRepository.findAllByOrderByInstalledAtDesc().stream()
                .map(this::toInstallationDto)
                .collect(Collectors.toList());
    }

    private Specification<PluginUsage> buildUsageSpec(String editorType, Long userId, String endpoint,
                                                      LocalDate from, LocalDate to) {
        return (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            if (editorType != null && !editorType.isBlank()) {
                try {
                    preds.add(cb.equal(root.get("editorType"), PluginEditorType.valueOf(editorType.toUpperCase())));
                } catch (IllegalArgumentException ignored) {
                    preds.add(cb.disjunction());
                }
            }
            if (userId != null) {
                preds.add(cb.equal(root.get("user").get("id"), userId));
            }
            if (endpoint != null && !endpoint.isBlank()) {
                preds.add(cb.equal(root.get("endpoint"), endpoint));
            }
            if (from != null) {
                preds.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay()));
            }
            if (to != null) {
                preds.add(cb.lessThan(root.get("createdAt"), to.plusDays(1).atStartOfDay()));
            }
            return cb.and(preds.toArray(new Predicate[0]));
        };
    }

    private List<LabelValueDto> toLabelValues(List<Object[]> rows) {
        return rows.stream()
                .map(r -> LabelValueDto.builder()
                        .label(String.valueOf(r[0]))
                        .value(((Number) r[1]).longValue())
                        .build())
                .collect(Collectors.toList());
    }

    private AdminPluginUsageDto toUsageDto(PluginUsage u) {
        return AdminPluginUsageDto.builder()
                .id(u.getId())
                .userId(u.getUser().getId())
                .userEmail(u.getUser().getEmail())
                .editorType(u.getEditorType().name())
                .endpoint(u.getEndpoint())
                .modelName(u.getModelName())
                .tokens(u.getTokens())
                .inputTokens(u.getInputTokens())
                .outputTokens(u.getOutputTokens())
                .cost(u.getCost())
                .createdAt(u.getCreatedAt())
                .build();
    }

    private AdminPluginSessionDto toSessionDto(PluginSession s) {
        return AdminPluginSessionDto.builder()
                .id(s.getId())
                .userId(s.getUser().getId())
                .userEmail(s.getUser().getEmail())
                .editorType(s.getEditorType().name())
                .projectName(s.getProjectName())
                .createdAt(s.getCreatedAt())
                .lastSeenAt(s.getLastSeenAt())
                .build();
    }

    private AdminPluginInstallationDto toInstallationDto(PluginInstallation i) {
        return AdminPluginInstallationDto.builder()
                .id(i.getId())
                .userId(i.getUser().getId())
                .userEmail(i.getUser().getEmail())
                .editorType(i.getEditorType().name())
                .version(i.getVersion())
                .installedAt(i.getInstalledAt())
                .build();
    }
}
