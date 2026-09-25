package com.fraudshield.auth;

import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.fraudshield.config.JwtProperties;
import com.fraudshield.user.UserPrincipal;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtProperties jwtProperties;

    private Key signingKey() {
        return Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes());
    }

    public String generateToken(UserPrincipal principal) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(principal.getUsername())
                .claim("userId", principal.getUserId().toString())
                .claim("organizationId", principal.getOrganizationId().toString())
                .claim("role", principal.getRole().name())
                .issuedAt(java.util.Date.from(now))
                .expiration(java.util.Date.from(now.plus(jwtProperties.getExpirationMinutes(), ChronoUnit.MINUTES)))
                .signWith(signingKey())
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith((javax.crypto.SecretKey) signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public UUID extractOrganizationId(String token) {
        return UUID.fromString(parseClaims(token).get("organizationId", String.class));
    }

    public boolean isValid(String token) {
        try {
            Claims claims = parseClaims(token);
            return claims.getExpiration().after(java.util.Date.from(Instant.now()));
        } catch (Exception e) {
            return false;
        }
    }
}
