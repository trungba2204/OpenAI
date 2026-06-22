package com.ai.platform.plugin.service;

import com.ai.platform.plugin.entity.PluginEditorType;
import com.ai.platform.plugin.entity.PluginInstallation;
import com.ai.platform.plugin.repository.PluginInstallationRepository;
import com.ai.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PluginInstallationService {

    private final PluginInstallationRepository installationRepository;

    @Transactional
    public void record(User user, PluginEditorType editorType, String version) {
        if (user == null || editorType == null) return;
        String v = version != null && !version.isBlank() ? version : "unknown";
        boolean exists = installationRepository.findByUserIdOrderByInstalledAtDesc(user.getId()).stream()
                .anyMatch(i -> i.getEditorType() == editorType
                        && v.equals(i.getVersion() != null ? i.getVersion() : "unknown"));
        if (!exists) {
            installationRepository.save(PluginInstallation.builder()
                    .user(user)
                    .editorType(editorType)
                    .version(v)
                    .build());
        }
    }
}
