package com.fraudshield.analytics;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

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

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final List<TransactionStatus> ANALYZED_STATUSES = List.of(
            TransactionStatus.APPROVED, TransactionStatus.REVIEW, TransactionStatus.BLOCKED, TransactionStatus.FAILED);
    private static final int TRANSACTIONS_OVER_TIME_DAYS = 14;

    private final TransactionRepository transactionRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final AlertRepository alertRepository;
    private final FraudCaseRepository fraudCaseRepository;

    public AnalyticsResponse forOrganization(UUID organizationId) {
        return new AnalyticsResponse(
                transactionRepository.countByOrganizationIdAndStatusIn(organizationId, ANALYZED_STATUSES),
                transactionRepository.countByOrganizationIdAndStatus(organizationId, TransactionStatus.APPROVED),
                transactionRepository.countByOrganizationIdAndStatus(organizationId, TransactionStatus.REVIEW),
                transactionRepository.countByOrganizationIdAndStatus(organizationId, TransactionStatus.BLOCKED),
                alertRepository.countByOrganizationId(organizationId),
                fraudCaseRepository.countByOrganizationId(organizationId),
                fraudCaseRepository.countByOrganizationIdAndDecision(organizationId, FraudCaseDecision.FALSE_POSITIVE),
                nullToZero(riskAssessmentRepository.averageRiskScore(organizationId)),
                nullToZero(riskAssessmentRepository.averageProcessingTimeMs(organizationId)),
                transactionsOverTime(organizationId),
                toRiskLevelMap(riskAssessmentRepository.countByRiskLevel(organizationId)),
                toRiskLevelMap(alertRepository.countBySeverity(organizationId)),
                toFraudCaseStatusMap(fraudCaseRepository.countByStatus(organizationId)));
    }

    private List<AnalyticsResponse.DailyCount> transactionsOverTime(UUID organizationId) {
        List<AnalyticsResponse.DailyCount> days = new java.util.ArrayList<>();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        for (int i = TRANSACTIONS_OVER_TIME_DAYS - 1; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            Instant start = day.atStartOfDay(ZoneOffset.UTC).toInstant();
            Instant end = day.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
            long count = transactionRepository.countByOrganizationIdAndOccurredAtBetween(organizationId, start, end);
            days.add(new AnalyticsResponse.DailyCount(day, count));
        }

        return days;
    }

    private Map<RiskLevel, Long> toRiskLevelMap(List<RiskLevelCount> counts) {
        Map<RiskLevel, Long> map = new EnumMap<>(RiskLevel.class);
        counts.forEach(c -> map.put(c.getLevel(), c.getTotal()));
        return map;
    }

    private Map<FraudCaseStatus, Long> toFraudCaseStatusMap(List<FraudCaseStatusCount> counts) {
        Map<FraudCaseStatus, Long> map = new EnumMap<>(FraudCaseStatus.class);
        counts.forEach(c -> map.put(c.getStatus(), c.getTotal()));
        return map;
    }

    private double nullToZero(Double value) {
        return value == null ? 0.0 : value;
    }
}
