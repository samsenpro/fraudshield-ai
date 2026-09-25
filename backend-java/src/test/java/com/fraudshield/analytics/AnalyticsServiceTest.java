package com.fraudshield.analytics;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fraudshield.alert.AlertRepository;
import com.fraudshield.analytics.dto.AnalyticsResponse;
import com.fraudshield.fraudcase.FraudCaseDecision;
import com.fraudshield.fraudcase.FraudCaseRepository;
import com.fraudshield.fraudcase.FraudCaseStatus;
import com.fraudshield.fraudcase.FraudCaseStatusCount;
import com.fraudshield.risk.RiskAssessmentRepository;
import com.fraudshield.risk.RiskLevel;
import com.fraudshield.risk.RiskLevelCount;
import com.fraudshield.transaction.TransactionRepository;
import com.fraudshield.transaction.TransactionStatus;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private RiskAssessmentRepository riskAssessmentRepository;
    @Mock
    private AlertRepository alertRepository;
    @Mock
    private FraudCaseRepository fraudCaseRepository;

    private final UUID organizationId = UUID.randomUUID();

    private AnalyticsService service() {
        return new AnalyticsService(transactionRepository, riskAssessmentRepository, alertRepository, fraudCaseRepository);
    }

    @Test
    void aggregatesCountsAveragesAndBreakdowns() {
        when(transactionRepository.countByOrganizationIdAndStatusIn(eq(organizationId), any())).thenReturn(100L);
        when(transactionRepository.countByOrganizationIdAndStatus(organizationId, TransactionStatus.APPROVED))
                .thenReturn(70L);
        when(transactionRepository.countByOrganizationIdAndStatus(organizationId, TransactionStatus.REVIEW))
                .thenReturn(20L);
        when(transactionRepository.countByOrganizationIdAndStatus(organizationId, TransactionStatus.BLOCKED))
                .thenReturn(10L);
        when(transactionRepository.countByOrganizationIdAndOccurredAtBetween(eq(organizationId), any(), any()))
                .thenReturn(5L);
        when(alertRepository.countByOrganizationId(organizationId)).thenReturn(15L);
        when(fraudCaseRepository.countByOrganizationId(organizationId)).thenReturn(8L);
        when(fraudCaseRepository.countByOrganizationIdAndDecision(organizationId, FraudCaseDecision.FALSE_POSITIVE))
                .thenReturn(3L);
        when(riskAssessmentRepository.averageRiskScore(organizationId)).thenReturn(0.42);
        when(riskAssessmentRepository.averageProcessingTimeMs(organizationId)).thenReturn(123.0);
        when(riskAssessmentRepository.countByRiskLevel(organizationId))
                .thenReturn(List.of(countOf(RiskLevel.HIGH, 4)));
        when(alertRepository.countBySeverity(organizationId)).thenReturn(List.of(countOf(RiskLevel.CRITICAL, 2)));
        when(fraudCaseRepository.countByStatus(organizationId))
                .thenReturn(List.of(statusCountOf(FraudCaseStatus.RESOLVED, 6)));

        AnalyticsResponse response = service().forOrganization(organizationId);

        assertThat(response.transactionsAnalyzed()).isEqualTo(100);
        assertThat(response.approved()).isEqualTo(70);
        assertThat(response.underReview()).isEqualTo(20);
        assertThat(response.blocked()).isEqualTo(10);
        assertThat(response.fraudAlerts()).isEqualTo(15);
        assertThat(response.fraudCases()).isEqualTo(8);
        assertThat(response.falsePositives()).isEqualTo(3);
        assertThat(response.averageRiskScore()).isEqualTo(0.42);
        assertThat(response.averageAnalysisTimeMs()).isEqualTo(123.0);
        assertThat(response.transactionsOverTime()).hasSize(14);
        assertThat(response.riskDistribution()).containsEntry(RiskLevel.HIGH, 4L);
        assertThat(response.alertsBySeverity()).containsEntry(RiskLevel.CRITICAL, 2L);
        assertThat(response.fraudCasesByStatus()).containsEntry(FraudCaseStatus.RESOLVED, 6L);
    }

    @Test
    void averagesFallBackToZeroWhenThereIsNoData() {
        when(transactionRepository.countByOrganizationIdAndStatusIn(eq(organizationId), any())).thenReturn(0L);
        when(transactionRepository.countByOrganizationIdAndOccurredAtBetween(eq(organizationId), any(), any()))
                .thenReturn(0L);
        when(riskAssessmentRepository.averageRiskScore(organizationId)).thenReturn(null);
        when(riskAssessmentRepository.averageProcessingTimeMs(organizationId)).thenReturn(null);
        when(riskAssessmentRepository.countByRiskLevel(organizationId)).thenReturn(List.of());
        when(alertRepository.countBySeverity(organizationId)).thenReturn(List.of());
        when(fraudCaseRepository.countByStatus(organizationId)).thenReturn(List.of());

        AnalyticsResponse response = service().forOrganization(organizationId);

        assertThat(response.averageRiskScore()).isEqualTo(0.0);
        assertThat(response.averageAnalysisTimeMs()).isEqualTo(0.0);
        assertThat(response.riskDistribution()).isEmpty();
    }

    private RiskLevelCount countOf(RiskLevel level, long total) {
        return new RiskLevelCount() {
            @Override
            public RiskLevel getLevel() {
                return level;
            }

            @Override
            public long getTotal() {
                return total;
            }
        };
    }

    private FraudCaseStatusCount statusCountOf(FraudCaseStatus status, long total) {
        return new FraudCaseStatusCount() {
            @Override
            public FraudCaseStatus getStatus() {
                return status;
            }

            @Override
            public long getTotal() {
                return total;
            }
        };
    }
}
