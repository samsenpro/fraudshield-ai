package com.fraudshield.ai.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AnalyzeTransactionRequest(
        UUID transactionId,
        UUID accountId,
        UUID customerId,
        BigDecimal amount,
        String currency,
        String merchant,
        String country,
        String city,
        String ipAddress,
        String deviceId,
        Instant timestamp,
        CustomerHistorySnapshot history,
        String correlationId) {
}
