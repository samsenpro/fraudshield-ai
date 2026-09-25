package com.fraudshield.auth.dto;

public record AuthResponse(String accessToken, String tokenType, String email, String role) {

    public static AuthResponse bearer(String accessToken, String email, String role) {
        return new AuthResponse(accessToken, "Bearer", email, role);
    }
}
