package com.fraudshield.risk;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.NestedConfigurationProperty;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "fraudshield.risk")
public class RiskProperties {

    @NestedConfigurationProperty
    private Thresholds thresholds = new Thresholds();

    @Getter
    @Setter
    public static class Thresholds {
        private double low = 0.29;
        private double medium = 0.59;
        private double high = 0.84;
    }
}
