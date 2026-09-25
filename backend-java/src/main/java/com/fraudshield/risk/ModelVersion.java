package com.fraudshield.risk;

import java.time.Instant;

import com.fraudshield.config.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
@Entity
@Table(name = "model_versions")
public class ModelVersion extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String version;

    @Column(name = "model_type", nullable = false)
    private String modelType;

    @Column(name = "dataset_version", nullable = false)
    private String datasetVersion;

    @Column(name = "trained_at", nullable = false)
    private Instant trainedAt;

    @Column(columnDefinition = "text")
    private String metrics;
}
