package com.fraudshield.risk;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ModelVersionRepository extends JpaRepository<ModelVersion, UUID> {

    Optional<ModelVersion> findByVersion(String version);

    /**
     * Registers a placeholder row for {@code version} unless one already exists.
     * Atomic in Postgres, so concurrent analyses that see the same new model
     * version don't race on the unique constraint (a find-then-save would).
     */
    @Modifying
    @Query(nativeQuery = true, value = """
            INSERT INTO model_versions (id, version, model_type, dataset_version, trained_at, created_at, updated_at)
            VALUES (gen_random_uuid(), :version, 'unknown', 'unknown', now(), now(), now())
            ON CONFLICT (version) DO NOTHING
            """)
    void registerIfAbsent(String version);
}
