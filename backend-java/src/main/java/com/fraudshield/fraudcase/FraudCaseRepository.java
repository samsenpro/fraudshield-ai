package com.fraudshield.fraudcase;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FraudCaseRepository extends JpaRepository<FraudCase, UUID> {

    Optional<FraudCase> findByAlertId(UUID alertId);

    // spring.jpa.open-in-view is disabled, so the lazy assignedReviewer must be
    // fetched here — otherwise mapping to a response DTO after the transaction
    // closes throws LazyInitializationException.
    @Query("select fc from FraudCase fc left join fetch fc.assignedReviewer where fc.id = :id")
    Optional<FraudCase> findDetailedById(@Param("id") UUID id);

    @Query(
            value = "select fc from FraudCase fc left join fetch fc.assignedReviewer where fc.organization.id = :organizationId",
            countQuery = "select count(fc) from FraudCase fc where fc.organization.id = :organizationId")
    Page<FraudCase> findByOrganizationId(@Param("organizationId") UUID organizationId, Pageable pageable);

    long countByOrganizationId(UUID organizationId);

    long countByOrganizationIdAndDecision(UUID organizationId, FraudCaseDecision decision);

    @Query("select fc.status as status, count(fc) as total from FraudCase fc "
            + "where fc.organization.id = :organizationId group by fc.status")
    List<FraudCaseStatusCount> countByStatus(@Param("organizationId") UUID organizationId);
}
