package com.fraudshield.risk;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RiskSignalRepository extends JpaRepository<RiskSignal, UUID> {

    List<RiskSignal> findByRiskAssessmentId(UUID riskAssessmentId);
}
