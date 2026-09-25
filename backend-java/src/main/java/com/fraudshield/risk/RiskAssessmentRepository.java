package com.fraudshield.risk;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RiskAssessmentRepository extends JpaRepository<RiskAssessment, UUID> {

    @EntityGraph(attributePaths = "modelVersion")
    Optional<RiskAssessment> findByTransactionId(UUID transactionId);

    @Query("select avg(ra.riskScore) from RiskAssessment ra where ra.transaction.organization.id = :organizationId")
    Double averageRiskScore(@Param("organizationId") UUID organizationId);

    @Query("select avg(ra.processingTimeMs) from RiskAssessment ra where ra.transaction.organization.id = :organizationId")
    Double averageProcessingTimeMs(@Param("organizationId") UUID organizationId);

    @Query("select ra.riskLevel as level, count(ra) as total from RiskAssessment ra "
            + "where ra.transaction.organization.id = :organizationId group by ra.riskLevel")
    List<RiskLevelCount> countByRiskLevel(@Param("organizationId") UUID organizationId);
}
