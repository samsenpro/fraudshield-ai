package com.fraudshield.alert;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertRepository extends JpaRepository<Alert, UUID> {

    Page<Alert> findByOrganizationId(UUID organizationId, Pageable pageable);
}
