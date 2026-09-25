package com.fraudshield.risk;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fraudshield.ai.dto.AnalyzeTransactionRequest;
import com.fraudshield.ai.dto.AnalyzeTransactionResponse;
import com.fraudshield.ai.dto.RiskSignalDto;
import com.fraudshield.alert.AlertService;
import com.fraudshield.audit.AuditAction;
import com.fraudshield.audit.AuditService;
import com.fraudshield.transaction.CustomerHistoryService;
import com.fraudshield.transaction.Transaction;
import com.fraudshield.transaction.TransactionRepository;
import com.fraudshield.transaction.TransactionStatus;

import lombok.RequiredArgsConstructor;

/**
 * The two @Transactional halves of {@link RiskAssessmentService#analyzeAsync}, kept
 * in a separate bean because Spring's transaction proxy does not intercept
 * self-invoked calls from within the same class.
 */
@Service
@RequiredArgsConstructor
class RiskAnalysisSteps {

    private static final Logger log = LoggerFactory.getLogger(RiskAnalysisSteps.class);

    private final TransactionRepository transactionRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final RiskSignalRepository riskSignalRepository;
    private final ModelVersionRepository modelVersionRepository;
    private final DecisionEngine decisionEngine;
    private final AlertService alertService;
    private final AuditService auditService;
    private final CustomerHistoryService customerHistoryService;

    @Transactional
    public AnalyzeTransactionRequest beginAnalysis(UUID transactionId) {
        Transaction transaction = transactionRepository.findDetailedById(transactionId).orElse(null);
        if (transaction == null) {
            log.error("Transaction {} not found, cannot analyze", transactionId);
            return null;
        }
        if (!transitionTo(transaction, TransactionStatus.ANALYZING)) {
            return null;
        }

        auditService.record(
                AuditAction.RISK_ANALYSIS_STARTED, "Transaction", transaction.getId(), transaction.getOrganization());

        return toAnalyzeRequest(transaction);
    }

    @Transactional
    public void completeAnalysis(UUID transactionId, AnalyzeTransactionResponse response) {
        Transaction transaction = transactionRepository.findById(transactionId).orElse(null);
        if (transaction == null) {
            log.error("Transaction {} disappeared during analysis", transactionId);
            return;
        }

        if (!response.available()) {
            log.warn("Fraud engine unavailable, leaving transaction {} as FAILED", transactionId);
            transitionTo(transaction, TransactionStatus.FAILED);
            return;
        }

        DecisionEngine.Result result = decisionEngine.decide(response.riskScore(), response.decision());
        persistAssessment(transaction, response, result);

        transitionTo(transaction, TransactionStatus.fromDecision(result.decision()));
        alertService.raiseIfNeeded(transaction, result.riskLevel(), describeSignals(response.signals()));

        auditService.record(
                AuditAction.RISK_ANALYSIS_COMPLETED, "Transaction", transaction.getId(), transaction.getOrganization());
    }

    private void persistAssessment(Transaction transaction, AnalyzeTransactionResponse response, DecisionEngine.Result result) {
        ModelVersion modelVersion = response.modelVersion() == null
                ? null
                : modelVersionRepository.findByVersion(response.modelVersion()).orElse(null);

        RiskAssessment assessment = riskAssessmentRepository.save(RiskAssessment.builder()
                .transaction(transaction)
                .modelVersion(modelVersion)
                .riskScore(response.riskScore())
                .riskLevel(result.riskLevel())
                .decision(result.decision())
                .confidence(response.confidence())
                .processingTimeMs(response.processingTimeMs())
                .build());

        List<RiskSignalDto> signals = response.signals();
        if (signals != null) {
            signals.forEach(signal -> riskSignalRepository.save(RiskSignal.builder()
                    .riskAssessment(assessment)
                    .code(signal.code())
                    .severity(parseSeverity(signal.severity()))
                    .score(signal.score())
                    .build()));
        }
    }

    private RiskLevel parseSeverity(String severity) {
        try {
            return RiskLevel.valueOf(severity);
        } catch (IllegalArgumentException | NullPointerException e) {
            return RiskLevel.MEDIUM;
        }
    }

    private boolean transitionTo(Transaction transaction, TransactionStatus target) {
        if (!transaction.getStatus().canTransitionTo(target)) {
            log.error("Invalid transition {} -> {} for transaction {}", transaction.getStatus(), target, transaction.getId());
            return false;
        }
        transaction.setStatus(target);
        transactionRepository.save(transaction);
        return true;
    }

    private AnalyzeTransactionRequest toAnalyzeRequest(Transaction transaction) {
        Instant occurredAt = transaction.getOccurredAt() == null ? Instant.now() : transaction.getOccurredAt();

        return new AnalyzeTransactionRequest(
                transaction.getId(),
                transaction.getAccount().getId(),
                transaction.getAccount().getCustomer().getId(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getMerchant(),
                transaction.getCountry(),
                transaction.getCity(),
                transaction.getIpAddress(),
                transaction.getDeviceId(),
                occurredAt,
                customerHistoryService.snapshot(transaction.getAccount(), occurredAt));
    }

    private String describeSignals(List<RiskSignalDto> signals) {
        if (signals == null || signals.isEmpty()) {
            return "Risk score exceeded the configured threshold";
        }
        return signals.stream().map(RiskSignalDto::code).reduce((a, b) -> a + ", " + b).orElse("");
    }
}
