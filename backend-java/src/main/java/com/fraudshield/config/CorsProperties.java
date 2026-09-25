package com.fraudshield.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "fraudshield.cors")
public class CorsProperties {

    private List<String> allowedOrigins = List.of("http://localhost:4200");
}
