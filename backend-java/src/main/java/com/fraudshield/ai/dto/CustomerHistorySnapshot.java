package com.fraudshield.ai.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record CustomerHistorySnapshot(
        int transactionCount,
        double averageAmount,
        List<String> usualCountries,
        List<String> usualCities,
        List<String> usualDevices,
        List<String> usualIpAddresses,
        Map<String, Integer> merchantFrequency,
        int transactionsLastHour,
        int transactionsLastDay,
        Instant lastTransactionAt) {

    public static CustomerHistorySnapshot empty() {
        return new CustomerHistorySnapshot(0, 0, List.of(), List.of(), List.of(), List.of(), Map.of(), 0, 0, null);
    }
}
