package com.fraudshield.ai.dto;

import java.util.List;

public record AnalyzeTransactionResponse(
        boolean available,
        double riskScore,
        String riskLevel,
        String decision,
        double confidence,
        List<RiskSignalDto> signals,
        String modelVersion,
        long processingTimeMs) {

    public static AnalyzeTransactionResponse unavailable() {
        return new AnalyzeTransactionResponse(false, 0, null, null, 0, List.of(), null, 0);
    }
}
