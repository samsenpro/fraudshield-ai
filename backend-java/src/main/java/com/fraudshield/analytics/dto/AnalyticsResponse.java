package com.fraudshield.analytics.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.fraudshield.fraudcase.FraudCaseStatus;
import com.fraudshield.risk.RiskLevel;

public record AnalyticsResponse(
        long transactionsAnalyzed,
        long approved,
        long underReview,
        long blocked,
        long fraudAlerts,
        long fraudCases,
        long falsePositives,
        double averageRiskScore,
        double averageAnalysisTimeMs,
        List<DailyCount> transactionsOverTime,
        Map<RiskLevel, Long> riskDistribution,
        Map<RiskLevel, Long> alertsBySeverity,
        Map<FraudCaseStatus, Long> fraudCasesByStatus) {

    public record DailyCount(LocalDate date, long count) {
    }
}
