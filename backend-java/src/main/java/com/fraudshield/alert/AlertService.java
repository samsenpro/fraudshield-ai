package com.fraudshield.alert;

import java.util.Set;

import org.springframework.stereotype.Service;

import com.fraudshield.audit.AuditAction;
import com.fraudshield.audit.AuditService;
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
}
