package com.fraudshield.transaction;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private static final Duration TTL = Duration.ofHours(24);
    private static final String KEY_PREFIX = "idempotency:";

    private final StringRedisTemplate redisTemplate;

    public Optional<UUID> findExistingTransaction(String idempotencyKey) {
        String value = redisTemplate.opsForValue().get(KEY_PREFIX + idempotencyKey);
        return Optional.ofNullable(value).map(UUID::fromString);
    }

    public void remember(String idempotencyKey, UUID transactionId) {
        redisTemplate.opsForValue().set(KEY_PREFIX + idempotencyKey, transactionId.toString(), TTL);
    }
}
