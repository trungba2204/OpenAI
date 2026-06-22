package com.ai.platform.plugin.service;

import com.ai.platform.plugin.dto.PluginSessionDto;
import com.ai.platform.plugin.entity.PluginEditorType;
import com.ai.platform.plugin.entity.PluginSession;
import com.ai.platform.plugin.repository.PluginSessionRepository;
import com.ai.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PluginSessionService {

    private final PluginSessionRepository sessionRepository;
    private final PluginInstallationService installationService;

    @Transactional
    public PluginSession touchSession(User user, PluginEditorType editorType, String projectName,
                                      String workspacePath, String extensionVersion) {
        installationService.record(user, editorType, extensionVersion);
        String hash = hashPath(workspacePath);
        return sessionRepository.findByUserIdOrderByLastSeenAtDesc(user.getId()).stream()
                .filter(s -> s.getEditorType() == editorType
                        && (hash == null || hash.equals(s.getWorkspacePathHash())))
                .findFirst()
                .map(s -> {
                    if (projectName != null) s.setProjectName(projectName);
                    return sessionRepository.save(s);
                })
                .orElseGet(() -> sessionRepository.save(PluginSession.builder()
                        .user(user)
                        .editorType(editorType)
                        .projectName(projectName)
                        .workspacePathHash(hash)
                        .build()));
    }

    @Transactional(readOnly = true)
    public List<PluginSessionDto> listSessions(User user) {
        return sessionRepository.findByUserIdOrderByLastSeenAtDesc(user.getId()).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private PluginSessionDto toDto(PluginSession s) {
        return PluginSessionDto.builder()
                .id(s.getId())
                .editorType(s.getEditorType().name())
                .projectName(s.getProjectName())
                .createdAt(s.getCreatedAt())
                .lastSeenAt(s.getLastSeenAt())
                .build();
    }

    private String hashPath(String path) {
        if (path == null || path.isBlank()) return null;
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(path.getBytes(StandardCharsets.UTF_8))).substring(0, 32);
        } catch (Exception e) {
            return null;
        }
    }
}
