package com.fraudshield.risk;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * Turns a raw risk score (plus the fraud engine's own suggested decision) into
 * the platform's final risk level and decision. Kept separate from
 * {@link com.fraudshield.ai.FraudEngineClient} so the scoring source can change
 * without touching how Java decides what to do about it.
 */
@Component
@RequiredArgsConstructor
@EnableConfigurationProperties(RiskProperties.class)
public class DecisionEngine {

    private final RiskProperties riskProperties;

    public record Result(RiskLevel riskLevel, Decision decision) {
    }

    public Result decide(double riskScore, String rawDecision) {
        RiskLevel riskLevel = riskLevelFor(riskScore);
        Decision decision = finalDecisionFor(riskLevel, rawDecision);
        return new Result(riskLevel, decision);
    }

    private RiskLevel riskLevelFor(double riskScore) {
        RiskProperties.Thresholds thresholds = riskProperties.getThresholds();
        if (riskScore <= thresholds.getLow()) {
            return RiskLevel.LOW;
        }
        if (riskScore <= thresholds.getMedium()) {
            return RiskLevel.MEDIUM;
        }
        if (riskScore <= thresholds.getHigh()) {
            return RiskLevel.HIGH;
        }
        return RiskLevel.CRITICAL;
    }

    /**
     * Java has the final say: a CRITICAL score can never resolve to APPROVE, even
     * if the fraud engine suggested it, and a HIGH score is never auto-approved.
     */
    private Decision finalDecisionFor(RiskLevel riskLevel, String rawDecision) {
        Decision suggested = parse(rawDecision);

        return switch (riskLevel) {
            case CRITICAL -> Decision.BLOCK;
            case HIGH -> suggested == Decision.BLOCK ? Decision.BLOCK : Decision.REVIEW;
            case MEDIUM -> suggested == Decision.APPROVE ? Decision.REVIEW : suggested;
            case LOW -> suggested;
        };
    }

    private Decision parse(String rawDecision) {
        if (rawDecision == null) {
            return Decision.REVIEW;
        }
        try {
            return Decision.valueOf(rawDecision);
        } catch (IllegalArgumentException e) {
            return Decision.REVIEW;
        }
    }
}
