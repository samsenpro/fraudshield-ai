package com.fraudshield.transaction.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.fraudshield.transaction.Transaction;
import com.fraudshield.transaction.TransactionStatus;

public record TransactionResponse(
        UUID id,
        UUID accountId,
        BigDecimal amount,
        String currency,
        String merchant,
        String country,
        String city,
        TransactionStatus status,
        Instant occurredAt,
        Instant createdAt) {

    public static TransactionResponse from(Transaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getAccount().getId(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getMerchant(),
                transaction.getCountry(),
                transaction.getCity(),
                transaction.getStatus(),
                transaction.getOccurredAt(),
                transaction.getCreatedAt());
    }
}
