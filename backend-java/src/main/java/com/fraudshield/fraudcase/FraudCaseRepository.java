package com.fraudshield.fraudcase;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FraudCaseRepository extends JpaRepository<FraudCase, UUID> {
}
