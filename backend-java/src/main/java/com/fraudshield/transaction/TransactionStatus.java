package com.fraudshield.transaction;

import java.util.Set;

import com.fraudshield.risk.Decision;

public enum TransactionStatus {
    PENDING,
    ANALYZING,
    APPROVED,
    REVIEW,
    BLOCKED,
    FAILED;

    private static final Set<TransactionStatus> TERMINAL = Set.of(APPROVED, REVIEW, BLOCKED, FAILED);

    public boolean canTransitionTo(TransactionStatus target) {
        if (TERMINAL.contains(this)) {
            return false;
        }
        return switch (this) {
            case PENDING -> target == ANALYZING || target == FAILED;
            case ANALYZING -> target == APPROVED || target == REVIEW || target == BLOCKED || target == FAILED;
            default -> false;
        };
    }

    public static TransactionStatus fromDecision(Decision decision) {
        return switch (decision) {
            case APPROVE -> APPROVED;
            case REVIEW -> REVIEW;
            case BLOCK -> BLOCKED;
        };
    }
}
