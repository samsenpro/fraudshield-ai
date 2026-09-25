package com.fraudshield.ai;

import java.util.concurrent.CompletableFuture;

import com.fraudshield.ai.dto.AnalyzeTransactionRequest;
import com.fraudshield.ai.dto.AnalyzeTransactionResponse;

/**
 * Abstraction over the Python fraud engine, so callers never depend on the
 * transport (REST today, could become messaging later) or on Resilience4j directly.
 */
public interface FraudEngineClient {

    CompletableFuture<AnalyzeTransactionResponse> analyze(AnalyzeTransactionRequest request);
}
