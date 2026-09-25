package com.fraudshield.fraudcase.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record CreateFraudCaseRequest(@NotNull UUID alertId) {
}
