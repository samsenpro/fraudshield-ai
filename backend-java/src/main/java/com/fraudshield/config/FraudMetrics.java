package com.fraudshield.config;

import org.springframework.stereotype.Component;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;

/** The custom counters called out in section 33, scraped via /actuator/prometheus. */
@Component
public class FraudMetrics {

    private final Counter transactionsAnalyzed;
    private final Counter riskAnalysisFailed;
    private final Counter fraudAlerts;
    private final Counter fraudCases;

    public FraudMetrics(MeterRegistry registry) {
        this.transactionsAnalyzed = Counter.builder("transactions_analyzed_total")
                .description("Transactions that finished fraud analysis, successfully or not")
                .register(registry);
        this.riskAnalysisFailed = Counter.builder("risk_analysis_failed_total")
                .description("Analyses that failed because the fraud engine was unavailable")
                .register(registry);
        this.fraudAlerts = Counter.builder("fraud_alerts_total")
                .description("Alerts raised from HIGH/CRITICAL risk assessments")
                .register(registry);
        this.fraudCases = Counter.builder("fraud_cases_total")
                .description("Fraud cases opened from an alert")
                .register(registry);
    }

    public void incrementTransactionsAnalyzed() {
        transactionsAnalyzed.increment();
    }

    public void incrementRiskAnalysisFailed() {
        riskAnalysisFailed.increment();
    }

    public void incrementFraudAlerts() {
        fraudAlerts.increment();
    }

    public void incrementFraudCases() {
        fraudCases.increment();
    }
}
