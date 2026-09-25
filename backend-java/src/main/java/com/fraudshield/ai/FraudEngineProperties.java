package com.fraudshield.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "fraudshield.fraud-engine")
public class FraudEngineProperties {

    private String baseUrl;
    private String apiKey;
    private long timeoutMs = 3000;
}
