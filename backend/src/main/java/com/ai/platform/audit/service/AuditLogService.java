package com.ai.platform.audit.service;

import com.ai.platform.audit.entity.AuditLog;
import com.ai.platform.audit.repository.AuditLogRepository;
import com.ai.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(User actor, String action, String resource, String ipAddress) {
        auditLogRepository.save(AuditLog.builder()
                .user(actor)
                .action(action)
                .resource(resource)
                .ipAddress(ipAddress)
                .build());
    }
}
