package com.fraudshield.transaction;

import java.util.UUID;

import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.fraudshield.account.Account;
import com.fraudshield.account.AccountRepository;
import com.fraudshield.audit.AuditAction;
import com.fraudshield.audit.AuditService;
import com.fraudshield.config.CorrelationIdFilter;
import com.fraudshield.exception.ApiException;
import com.fraudshield.organization.Organization;
import com.fraudshield.risk.RiskAssessmentService;
import com.fraudshield.transaction.dto.CreateTransactionRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final IdempotencyService idempotencyService;
    private final AuditService auditService;
    private final RiskAssessmentService riskAssessmentService;

    public Transaction create(CreateTransactionRequest request, Organization organization, String idempotencyKey) {
        if (idempotencyKey != null) {
            var existing = idempotencyService.findExistingTransaction(idempotencyKey);
            if (existing.isPresent()) {
                return transactionRepository.findById(existing.get())
                        .orElseThrow(() -> ApiException.notFound("Transaction not found"));
            }
        }

        Account account = accountRepository.findById(request.accountId())
                .filter(a -> a.getOrganization().getId().equals(organization.getId()))
                .orElseThrow(() -> ApiException.notFound("Account not found"));

        Transaction transaction;
        try {
            // A single repository call is already atomic; no need for a wider
            // @Transactional here — and this method must stay non-transactional
            // so the row is committed *before* analyzeAsync reads it below.
            transaction = transactionRepository.save(Transaction.builder()
                    .organization(organization)
                    .account(account)
                    .amount(request.amount())
                    .currency(request.currency())
                    .merchant(request.merchant())
                    .country(request.country())
                    .city(request.city())
                    .ipAddress(request.ipAddress())
                    .deviceId(request.deviceId())
                    .occurredAt(request.timestamp())
                    .status(TransactionStatus.PENDING)
                    .idempotencyKey(idempotencyKey)
                    .build());
        } catch (DataIntegrityViolationException e) {
            // Concurrent request with the same idempotency key won the race.
            if (idempotencyKey == null) {
                throw e;
            }
            return transactionRepository.findByIdempotencyKey(idempotencyKey)
                    .orElseThrow(() -> e);
        }

        if (idempotencyKey != null) {
            idempotencyService.remember(idempotencyKey, transaction.getId());
        }

        auditService.record(AuditAction.TRANSACTION_CREATED, "Transaction", transaction.getId(), organization);

        // MDC is thread-local: capture it here, on the request thread, and hand
        // it to the @Async method explicitly since its worker thread starts empty.
        String correlationId = MDC.get(CorrelationIdFilter.MDC_KEY);
        riskAssessmentService.analyzeAsync(transaction.getId(), correlationId);

        return transaction;
    }

    public Transaction getForOrganization(UUID transactionId, UUID organizationId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> ApiException.notFound("Transaction not found"));
        if (!transaction.getOrganization().getId().equals(organizationId)) {
            throw ApiException.notFound("Transaction not found");
        }
        return transaction;
    }

    public Page<Transaction> listForOrganization(UUID organizationId, Pageable pageable) {
        return transactionRepository.findByOrganizationId(organizationId, pageable);
    }
}
