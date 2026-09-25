package com.fraudshield.transaction;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.fraudshield.risk.Decision;

class TransactionStatusTest {

    @Test
    void pendingCanOnlyMoveToAnalyzingOrFailed() {
        assertThat(TransactionStatus.PENDING.canTransitionTo(TransactionStatus.ANALYZING)).isTrue();
        assertThat(TransactionStatus.PENDING.canTransitionTo(TransactionStatus.FAILED)).isTrue();
        assertThat(TransactionStatus.PENDING.canTransitionTo(TransactionStatus.APPROVED)).isFalse();
    }

    @Test
    void analyzingCanResolveToAnyTerminalStatus() {
        assertThat(TransactionStatus.ANALYZING.canTransitionTo(TransactionStatus.APPROVED)).isTrue();
        assertThat(TransactionStatus.ANALYZING.canTransitionTo(TransactionStatus.REVIEW)).isTrue();
        assertThat(TransactionStatus.ANALYZING.canTransitionTo(TransactionStatus.BLOCKED)).isTrue();
        assertThat(TransactionStatus.ANALYZING.canTransitionTo(TransactionStatus.FAILED)).isTrue();
        assertThat(TransactionStatus.ANALYZING.canTransitionTo(TransactionStatus.PENDING)).isFalse();
    }

    @Test
    void terminalStatusesCannotTransitionAnywhere() {
        for (TransactionStatus terminal : new TransactionStatus[] {
                TransactionStatus.APPROVED, TransactionStatus.REVIEW, TransactionStatus.BLOCKED, TransactionStatus.FAILED}) {
            for (TransactionStatus target : TransactionStatus.values()) {
                assertThat(terminal.canTransitionTo(target)).isFalse();
            }
        }
    }

    @Test
    void mapsDecisionToTheMatchingStatus() {
        assertThat(TransactionStatus.fromDecision(Decision.APPROVE)).isEqualTo(TransactionStatus.APPROVED);
        assertThat(TransactionStatus.fromDecision(Decision.REVIEW)).isEqualTo(TransactionStatus.REVIEW);
        assertThat(TransactionStatus.fromDecision(Decision.BLOCK)).isEqualTo(TransactionStatus.BLOCKED);
    }
}
