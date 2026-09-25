package com.fraudshield.transaction;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);

    Page<Transaction> findByOrganizationId(UUID organizationId, Pageable pageable);

    @Query("select t from Transaction t "
            + "join fetch t.account a "
            + "join fetch a.customer "
            + "join fetch t.organization "
            + "where t.id = :id")
    Optional<Transaction> findDetailedById(@Param("id") UUID id);

    /** Most recent prior transactions for a customer, across all of their accounts. */
    List<Transaction> findByAccount_Customer_IdAndOccurredAtLessThanOrderByOccurredAtDesc(
            UUID customerId, Instant before, Pageable pageable);
}
