package com.fraudshield.config;

import org.flywaydb.core.Flyway;

/**
 * Spring Boot 4.1.1 ships no Flyway autoconfiguration at all (verified: no
 * {@code spring-boot-flyway} module exists, and none of the spring-boot-*
 * jars on the classpath contain a Flyway class) — {@code ddl-auto: validate}
 * would otherwise fail against an empty database on every fresh environment.
 * Migrating explicitly, before the Spring context (and its Hibernate schema
 * validation) starts, sidesteps needing any bean-ordering trick.
 */
public final class FlywayMigration {

    private FlywayMigration() {}

    public static void run() {
        String host = env("POSTGRES_HOST", "localhost");
        String port = env("POSTGRES_PORT", "5432");
        String database = env("POSTGRES_DB", "fraudshield");
        String user = env("POSTGRES_USER", "fraudshield");
        String password = env("POSTGRES_PASSWORD", "fraudshield");
        String url = "jdbc:postgresql://%s:%s/%s".formatted(host, port, database);

        Flyway.configure()
                .dataSource(url, user, password)
                .locations("classpath:db/migration")
                .load()
                .migrate();
    }

    private static String env(String name, String fallback) {
        String value = System.getenv(name);
        return (value == null || value.isBlank()) ? fallback : value;
    }
}
