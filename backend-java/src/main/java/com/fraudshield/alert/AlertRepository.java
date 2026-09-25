package com.fraudshield.alert;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fraudshield.risk.RiskLevelCount;

public interface AlertRepository extends JpaRepository<Alert, UUID> {

    Page<Alert> findByOrganizationId(UUID organizationId, Pageable pageable);

    long countByOrganizationId(UUID organizationId);

    @Query("select a.severity as level, count(a) as total from Alert a "
            + "where a.organization.id = :organizationId group by a.severity")
    List<RiskLevelCount> countBySeverity(@Param("organizationId") UUID organizationId);
}
