package com.fraudshield.config;

import java.util.concurrent.Executor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean("fraudAnalysisExecutor")
    public Executor fraudAnalysisExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("fraud-analysis-");
        executor.initialize();
        return executor;
    }

    /**
     * Runs the HTTP calls to the fraud engine. Must be separate from
     * {@code fraudAnalysisExecutor}: each analysis thread blocks on its engine
     * call, so sharing one pool deadlocks once every analysis thread is waiting
     * on a call queued behind the others (surfacing as TimeLimiter timeouts).
     */
    @Bean("fraudEngineCallExecutor")
    public Executor fraudEngineCallExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("fraud-engine-call-");
        executor.initialize();
        return executor;
    }
}
