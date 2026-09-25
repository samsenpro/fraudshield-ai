package com.fraudshield.transaction;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fraudshield.account.Account;
import com.fraudshield.ai.dto.CustomerHistorySnapshot;
import com.fraudshield.customer.Customer;

@ExtendWith(MockitoExtension.class)
class CustomerHistoryServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Test
    void returnsEmptySnapshotWhenNoPriorTransactions() {
        CustomerHistoryService serviceWithMock = new CustomerHistoryService(transactionRepository);
        Account account = accountFor(UUID.randomUUID());
        when(transactionRepository.findByAccount_Customer_IdAndOccurredAtLessThanOrderByOccurredAtDesc(
                any(), any(), any())).thenReturn(List.of());

        CustomerHistorySnapshot snapshot = serviceWithMock.snapshot(account, Instant.now());

        assertThat(snapshot).isEqualTo(CustomerHistorySnapshot.empty());
    }

    @Test
    void aggregatesAverageAmountDistinctValuesAndVelocityWindows() {
        CustomerHistoryService serviceWithMock = new CustomerHistoryService(transactionRepository);
        UUID customerId = UUID.randomUUID();
        Account account = accountFor(customerId);
        Instant now = Instant.now();

        Transaction recent = transaction(now.minus(30, ChronoUnit.MINUTES), "CO", "device-1", new BigDecimal("100"));
        Transaction earlierToday = transaction(now.minus(5, ChronoUnit.HOURS), "CO", "device-1", new BigDecimal("50"));
        Transaction lastWeek = transaction(now.minus(10, ChronoUnit.DAYS), "MX", "device-2", new BigDecimal("200"));

        when(transactionRepository.findByAccount_Customer_IdAndOccurredAtLessThanOrderByOccurredAtDesc(
                eq(customerId), eq(now), any()))
                .thenReturn(List.of(recent, earlierToday, lastWeek));

        CustomerHistorySnapshot snapshot = serviceWithMock.snapshot(account, now);

        assertThat(snapshot.transactionCount()).isEqualTo(3);
        assertThat(snapshot.averageAmount()).isEqualTo((100 + 50 + 200) / 3.0);
        assertThat(snapshot.usualCountries()).containsExactlyInAnyOrder("CO", "MX");
        assertThat(snapshot.usualDevices()).containsExactlyInAnyOrder("device-1", "device-2");
        assertThat(snapshot.transactionsLastHour()).isEqualTo(1);
        assertThat(snapshot.transactionsLastDay()).isEqualTo(2);
        assertThat(snapshot.lastTransactionAt()).isEqualTo(recent.getOccurredAt());
    }

    private Account accountFor(UUID customerId) {
        Customer customer = Customer.builder().build();
        customer.setId(customerId);
        Account account = Account.builder().customer(customer).build();
        account.setId(UUID.randomUUID());
        return account;
    }

    private Transaction transaction(Instant occurredAt, String country, String deviceId, BigDecimal amount) {
        Transaction transaction = Transaction.builder()
                .amount(amount)
                .currency("COP")
                .merchant("SuperMarket")
                .country(country)
                .city("City")
                .deviceId(deviceId)
                .ipAddress("10.0.0.1")
                .occurredAt(occurredAt)
                .status(TransactionStatus.APPROVED)
                .build();
        transaction.setId(UUID.randomUUID());
        return transaction;
    }
}
