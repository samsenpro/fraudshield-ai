package com.fraudshield.ai;

import java.util.concurrent.CompletableFuture;

import com.fraudshield.ai.dto.AnalyzeTransactionRequest;
import com.fraudshield.ai.dto.AnalyzeTransactionResponse;

/**
 * Abstraction over the Python fraud engine, so callers never depend on the
 * transport (REST today, could become messaging later) or on Resilience4j directly.
 */
public interface FraudEngineClient {

    /** Completes with {@code null} if the engine is unavailable (see the circuit breaker fallback). */
    CompletableFuture<AnalyzeTransactionResponse> analyze(AnalyzeTransactionRequest request);
}
