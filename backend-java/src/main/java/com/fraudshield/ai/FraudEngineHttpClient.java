package com.fraudshield.ai;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.fraudshield.ai.dto.AnalyzeTransactionRequest;
import com.fraudshield.ai.dto.AnalyzeTransactionResponse;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;

@Component
public class FraudEngineHttpClient implements FraudEngineClient {

    private static final Logger log = LoggerFactory.getLogger(FraudEngineHttpClient.class);

    private final RestClient restClient;
    private final Executor fraudAnalysisExecutor;

    public FraudEngineHttpClient(
            RestClient fraudEngineRestClient,
            @Qualifier("fraudAnalysisExecutor") Executor fraudAnalysisExecutor) {
        this.restClient = fraudEngineRestClient;
        this.fraudAnalysisExecutor = fraudAnalysisExecutor;
    }

    @Override
    @CircuitBreaker(name = "fraudEngine", fallbackMethod = "analyzeFallback")
    @Retry(name = "fraudEngine")
    @TimeLimiter(name = "fraudEngine")
    public CompletableFuture<AnalyzeTransactionResponse> analyze(AnalyzeTransactionRequest request) {
        return CompletableFuture.supplyAsync(() -> callAnalyze(request), fraudAnalysisExecutor);
    }

    private AnalyzeTransactionResponse callAnalyze(AnalyzeTransactionRequest request) {
        String correlationId = request.correlationId() != null ? request.correlationId() : request.transactionId().toString();
        log.info("Calling fraud engine /api/v1/analyze correlationId={}", correlationId);

        return restClient.post()
                .uri("/api/v1/analyze")
                .header("X-Correlation-Id", correlationId)
                .body(request)
                .retrieve()
                .body(AnalyzeTransactionResponse.class);
    }

    @SuppressWarnings("unused")
    private CompletableFuture<AnalyzeTransactionResponse> analyzeFallback(AnalyzeTransactionRequest request, Throwable t) {
        log.warn("Fraud engine unavailable for transaction {}: {}", request.transactionId(), t.toString());
        return CompletableFuture.completedFuture(null);
    }
}
