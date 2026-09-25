package com.fraudshield.transaction.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateTransactionRequest(
        @NotNull UUID accountId,
        @NotNull @Positive BigDecimal amount,
        @NotBlank @Size(min = 3, max = 3) String currency,
        @NotBlank String merchant,
        @NotBlank @Size(min = 2, max = 2) String country,
        String city,
        String ipAddress,
        String deviceId,
        @NotNull Instant timestamp) {
}
