package com.fraudshield.ai.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Mirrors exactly what the fraud engine's /analyze actually returns — no
 * "available" flag here, because Python never sends one. Unavailability is
 * represented by the caller getting {@code null} back (see
 * {@link com.fraudshield.ai.FraudEngineHttpClient}), never by a JSON field.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AnalyzeTransactionResponse(
        double riskScore,
        String riskLevel,
        String decision,
        double confidence,
        List<RiskSignalDto> signals,
        String modelVersion,
        long processingTimeMs) {
}
