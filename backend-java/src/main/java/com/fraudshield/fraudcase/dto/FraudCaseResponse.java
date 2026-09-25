package com.fraudshield.fraudcase.dto;

import java.time.Instant;
import java.util.UUID;

import com.fraudshield.fraudcase.FraudCase;
import com.fraudshield.fraudcase.FraudCaseDecision;
import com.fraudshield.fraudcase.FraudCaseStatus;

public record FraudCaseResponse(
        UUID id,
        UUID alertId,
        UUID transactionId,
        FraudCaseStatus status,
        UUID assignedReviewerId,
        String assignedReviewerName,
        String notes,
        FraudCaseDecision decision,
        Instant createdAt,
        Instant resolvedAt) {

    public static FraudCaseResponse from(FraudCase fraudCase) {
        return new FraudCaseResponse(
                fraudCase.getId(),
                fraudCase.getAlert() == null ? null : fraudCase.getAlert().getId(),
                fraudCase.getTransaction().getId(),
                fraudCase.getStatus(),
                fraudCase.getAssignedReviewer() == null ? null : fraudCase.getAssignedReviewer().getId(),
                fraudCase.getAssignedReviewer() == null ? null : fraudCase.getAssignedReviewer().getFullName(),
                fraudCase.getNotes(),
                fraudCase.getDecision(),
                fraudCase.getCreatedAt(),
                fraudCase.getResolvedAt());
    }
}
