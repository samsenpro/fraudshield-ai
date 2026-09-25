package com.fraudshield.risk;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class DecisionEngineTest {

    private final RiskProperties riskProperties = new RiskProperties();
    private final DecisionEngine decisionEngine = new DecisionEngine(riskProperties);

    @Test
    void classifiesRiskLevelsAtThresholdBoundaries() {
        assertThat(decisionEngine.decide(0.10, "APPROVE").riskLevel()).isEqualTo(RiskLevel.LOW);
        assertThat(decisionEngine.decide(0.29, "APPROVE").riskLevel()).isEqualTo(RiskLevel.LOW);
        assertThat(decisionEngine.decide(0.30, "APPROVE").riskLevel()).isEqualTo(RiskLevel.MEDIUM);
        assertThat(decisionEngine.decide(0.59, "APPROVE").riskLevel()).isEqualTo(RiskLevel.MEDIUM);
        assertThat(decisionEngine.decide(0.60, "APPROVE").riskLevel()).isEqualTo(RiskLevel.HIGH);
        assertThat(decisionEngine.decide(0.84, "APPROVE").riskLevel()).isEqualTo(RiskLevel.HIGH);
        assertThat(decisionEngine.decide(0.85, "APPROVE").riskLevel()).isEqualTo(RiskLevel.CRITICAL);
    }

    @Test
    void neverApprovesACriticalScoreEvenIfEngineSuggestsApprove() {
        DecisionEngine.Result result = decisionEngine.decide(0.95, "APPROVE");

        assertThat(result.riskLevel()).isEqualTo(RiskLevel.CRITICAL);
        assertThat(result.decision()).isEqualTo(Decision.BLOCK);
    }

    @Test
    void neverAutoApprovesAHighScore() {
        DecisionEngine.Result result = decisionEngine.decide(0.70, "APPROVE");

        assertThat(result.riskLevel()).isEqualTo(RiskLevel.HIGH);
        assertThat(result.decision()).isEqualTo(Decision.REVIEW);
    }

    @Test
    void keepsEngineBlockDecisionOnHighScore() {
        DecisionEngine.Result result = decisionEngine.decide(0.70, "BLOCK");

        assertThat(result.decision()).isEqualTo(Decision.BLOCK);
    }

    @Test
    void treatsUnknownOrMissingRawDecisionAsReview() {
        assertThat(decisionEngine.decide(0.10, null).decision()).isEqualTo(Decision.REVIEW);
        assertThat(decisionEngine.decide(0.10, "not-a-decision").decision()).isEqualTo(Decision.REVIEW);
    }

    @Test
    void trustsLowRiskApproveFromEngine() {
        DecisionEngine.Result result = decisionEngine.decide(0.05, "APPROVE");

        assertThat(result.decision()).isEqualTo(Decision.APPROVE);
    }
}
