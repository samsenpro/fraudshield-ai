package com.fraudshield.fraudcase.dto;

import com.fraudshield.fraudcase.FraudCaseDecision;

import jakarta.validation.constraints.NotNull;

public record ResolveFraudCaseRequest(@NotNull FraudCaseDecision decision, String notes) {
}
