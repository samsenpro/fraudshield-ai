package com.fraudshield.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "fraudshield.jwt")
public class JwtProperties {

    private String secret;
    private long expirationMinutes = 60;
}
