package com.fraudshield.risk;

import java.util.List;
import java.util.UUID;

import org.slf4j.MDC;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.fraudshield.ai.FraudEngineClient;
import com.fraudshield.ai.dto.AnalyzeTransactionRequest;
import com.fraudshield.ai.dto.AnalyzeTransactionResponse;
import com.fraudshield.config.CorrelationIdFilter;
import com.fraudshield.exception.ApiException;
import com.fraudshield.risk.dto.RiskAssessmentResponse;

import lombok.RequiredArgsConstructor;

/**
 * Entry point for asynchronous fraud analysis. Runs off the request thread
 * (see {@link com.fraudshield.config.AsyncConfig}) and keeps the slow, external
 * fraud engine call outside of any database transaction — the transactional
 * work before/after it lives in {@link RiskAnalysisSteps}.
 */
@Service
@RequiredArgsConstructor
public class RiskAssessmentService {

    private final FraudEngineClient fraudEngineClient;
    private final RiskAnalysisSteps steps;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final RiskSignalRepository riskSignalRepository;

    @Async("fraudAnalysisExecutor")
    public void analyzeAsync(UUID transactionId, String correlationId) {
        // The worker thread's MDC starts empty — put the caller's correlation id
        // back so every log line in this async flow (and the outgoing call to
        // the fraud engine) can still be traced to the originating request.
        MDC.put(CorrelationIdFilter.MDC_KEY, correlationId);
        try {
            AnalyzeTransactionRequest request = steps.beginAnalysis(transactionId, correlationId);
            if (request == null) {
                return;
            }

            AnalyzeTransactionResponse response = fraudEngineClient.analyze(request).join();

            steps.completeAnalysis(transactionId, response);
        } finally {
            MDC.remove(CorrelationIdFilter.MDC_KEY);
        }
    }

    public RiskAssessmentResponse getForTransaction(UUID transactionId) {
        RiskAssessment assessment = riskAssessmentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> ApiException.notFound("Risk assessment not available yet"));
        List<RiskSignal> signals = riskSignalRepository.findByRiskAssessmentId(assessment.getId());
        return RiskAssessmentResponse.from(assessment, signals);
    }
}
