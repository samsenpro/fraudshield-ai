package com.fraudshield.audit;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.fraudshield.organization.Organization;
import com.fraudshield.user.User;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void record(AuditAction action, String entityType, UUID entityId, User user, Organization organization, String metadata) {
        auditLogRepository.save(AuditLog.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .user(user)
                .organization(organization)
                .metadata(metadata)
                .build());
    }

    public void record(AuditAction action, String entityType, UUID entityId, Organization organization) {
        record(action, entityType, entityId, null, organization, null);
    }
}
