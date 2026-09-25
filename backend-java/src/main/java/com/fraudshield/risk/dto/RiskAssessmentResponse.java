package com.fraudshield.risk.dto;

import java.util.List;
import java.util.UUID;

import com.fraudshield.risk.Decision;
import com.fraudshield.risk.RiskAssessment;
import com.fraudshield.risk.RiskLevel;
import com.fraudshield.risk.RiskSignal;

public record RiskAssessmentResponse(
        UUID transactionId,
        double riskScore,
        RiskLevel riskLevel,
        Decision decision,
        double confidence,
        List<SignalResponse> signals,
        String modelVersion,
        long processingTimeMs) {

    public record SignalResponse(String code, RiskLevel severity, Double score) {
        static SignalResponse from(RiskSignal signal) {
            return new SignalResponse(signal.getCode(), signal.getSeverity(), signal.getScore());
        }
    }

    public static RiskAssessmentResponse from(RiskAssessment assessment, List<RiskSignal> signals) {
        return new RiskAssessmentResponse(
                assessment.getTransaction().getId(),
                assessment.getRiskScore(),
                assessment.getRiskLevel(),
                assessment.getDecision(),
                assessment.getConfidence(),
                signals.stream().map(SignalResponse::from).toList(),
                assessment.getModelVersion() == null ? null : assessment.getModelVersion().getVersion(),
                assessment.getProcessingTimeMs());
    }
}
