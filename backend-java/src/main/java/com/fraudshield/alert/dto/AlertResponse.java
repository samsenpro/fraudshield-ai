package com.fraudshield.alert.dto;

import java.time.Instant;
import java.util.UUID;

import com.fraudshield.alert.Alert;
import com.fraudshield.alert.AlertStatus;
import com.fraudshield.risk.RiskLevel;

public record AlertResponse(
        UUID id,
        UUID transactionId,
        RiskLevel severity,
        AlertStatus status,
        String reason,
        Instant createdAt,
        Instant resolvedAt) {

    public static AlertResponse from(Alert alert) {
        return new AlertResponse(
                alert.getId(),
                alert.getTransaction().getId(),
                alert.getSeverity(),
                alert.getStatus(),
                alert.getReason(),
                alert.getCreatedAt(),
                alert.getResolvedAt());
    }
}
