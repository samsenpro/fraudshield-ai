package com.fraudshield.config;

import java.net.http.HttpClient;
import java.time.Duration;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import com.fraudshield.ai.FraudEngineProperties;

@Configuration
@EnableConfigurationProperties(FraudEngineProperties.class)
public class RestClientConfig {

    @Bean
    public RestClient fraudEngineRestClient(FraudEngineProperties properties) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(properties.getTimeoutMs()))
                // Without this, the JDK client tries an h2c (HTTP/2 cleartext) upgrade
                // on the first request; uvicorn/h11 rejects that as an unsupported
                // upgrade and fails the whole request ("Invalid HTTP request received").
                .version(HttpClient.Version.HTTP_1_1)
                .build();

        var requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofMillis(properties.getTimeoutMs()));

        return RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .requestFactory(requestFactory)
                .defaultHeader("X-Api-Key", properties.getApiKey())
                .build();
    }
}
