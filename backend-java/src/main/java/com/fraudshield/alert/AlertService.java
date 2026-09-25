package com.fraudshield.alert;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.fraudshield.audit.AuditAction;
import com.fraudshield.audit.AuditService;
import com.fraudshield.exception.ApiException;
import com.fraudshield.risk.RiskLevel;
import com.fraudshield.transaction.Transaction;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AlertService {

    private static final Set<RiskLevel> ALERTABLE_LEVELS = Set.of(RiskLevel.HIGH, RiskLevel.CRITICAL);

    private final AlertRepository alertRepository;
    private final AuditService auditService;

    public void raiseIfNeeded(Transaction transaction, RiskLevel riskLevel, String reason) {
        if (!ALERTABLE_LEVELS.contains(riskLevel)) {
            return;
        }

        Alert alert = alertRepository.save(Alert.builder()
                .transaction(transaction)
                .organization(transaction.getOrganization())
                .severity(riskLevel)
                .status(AlertStatus.OPEN)
                .reason(reason)
                .build());

        auditService.record(AuditAction.ALERT_CREATED, "Alert", alert.getId(), transaction.getOrganization());
    }

    public Page<Alert> listForOrganization(UUID organizationId, Pageable pageable) {
        return alertRepository.findByOrganizationId(organizationId, pageable);
    }

    public Alert getForOrganization(UUID alertId, UUID organizationId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> ApiException.notFound("Alert not found"));
        if (!alert.getOrganization().getId().equals(organizationId)) {
            throw ApiException.notFound("Alert not found");
        }
        return alert;
    }

    /** Called when a reviewer opens a fraud case from this alert (section 30). */
    public void markUnderInvestigation(Alert alert) {
        if (alert.getStatus() != AlertStatus.OPEN) {
            throw ApiException.conflict("Alert is not open for investigation");
        }
        alert.setStatus(AlertStatus.INVESTIGATING);
        alertRepository.save(alert);
    }

    /** Called when the linked fraud case is resolved. */
    public void markResolved(Alert alert) {
        alert.setStatus(AlertStatus.RESOLVED);
        alert.setResolvedAt(Instant.now());
        alertRepository.save(alert);
    }
}
