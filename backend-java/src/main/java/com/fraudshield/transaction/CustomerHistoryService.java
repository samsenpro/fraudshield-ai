package com.fraudshield.transaction;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.fraudshield.account.Account;
import com.fraudshield.ai.dto.CustomerHistorySnapshot;

import lombok.RequiredArgsConstructor;

/**
 * Builds the customer-history snapshot sent to the fraud engine (section 12).
 * Java stays the only thing that touches the transactions table directly —
 * Python never gets raw DB access, only this derived, read-only snapshot.
 */
@Service
@RequiredArgsConstructor
public class CustomerHistoryService {

    private static final int HISTORY_WINDOW_SIZE = 50;

    private final TransactionRepository transactionRepository;

    public CustomerHistorySnapshot snapshot(Account account, Instant before) {
        List<Transaction> recent = transactionRepository
                .findByAccount_Customer_IdAndOccurredAtLessThanOrderByOccurredAtDesc(
                        account.getCustomer().getId(), before, PageRequest.of(0, HISTORY_WINDOW_SIZE));

        if (recent.isEmpty()) {
            return CustomerHistorySnapshot.empty();
        }

        double averageAmount = recent.stream()
                .mapToDouble(t -> t.getAmount().doubleValue())
                .average()
                .orElse(0);

        Map<String, Integer> merchantFrequency = new HashMap<>();
        recent.forEach(t -> merchantFrequency.merge(t.getMerchant(), 1, Integer::sum));

        int lastHour = countWithin(recent, before, Duration.ofHours(1));
        int lastDay = countWithin(recent, before, Duration.ofDays(1));

        return new CustomerHistorySnapshot(
                recent.size(),
                averageAmount,
                distinct(recent, Transaction::getCountry),
                distinct(recent, Transaction::getCity),
                distinct(recent, Transaction::getDeviceId),
                distinct(recent, Transaction::getIpAddress),
                merchantFrequency,
                lastHour,
                lastDay,
                recent.get(0).getOccurredAt());
    }

    private int countWithin(List<Transaction> transactions, Instant reference, Duration window) {
        Instant cutoff = reference.minus(window);
        return (int) transactions.stream().filter(t -> t.getOccurredAt().isAfter(cutoff)).count();
    }

    private List<String> distinct(List<Transaction> transactions, java.util.function.Function<Transaction, String> extractor) {
        return transactions.stream()
                .map(extractor)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
    }
}
