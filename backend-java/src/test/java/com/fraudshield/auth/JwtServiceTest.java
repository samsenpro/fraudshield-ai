package com.fraudshield.auth;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.fraudshield.config.JwtProperties;
import com.fraudshield.organization.Organization;
import com.fraudshield.user.Role;
import com.fraudshield.user.User;
import com.fraudshield.user.UserPrincipal;

class JwtServiceTest {

    private JwtService jwtService;
    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("test-secret-key-with-at-least-32-characters!!");
        properties.setExpirationMinutes(60);
        jwtService = new JwtService(properties);

        Organization organization = Organization.builder().build();
        organization.setId(java.util.UUID.randomUUID());

        User user = User.builder()
                .organization(organization)
                .email("analyst@fraudshield.ai")
                .passwordHash("irrelevant")
                .fullName("Test Analyst")
                .role(Role.ANALYST)
                .build();
        user.setId(java.util.UUID.randomUUID());

        principal = new UserPrincipal(user);
    }

    @Test
    void generatesTokenThatRoundTripsClaims() {
        String token = jwtService.generateToken(principal);

        assertThat(jwtService.isValid(token)).isTrue();
        assertThat(jwtService.extractEmail(token)).isEqualTo(principal.getUsername());
        assertThat(jwtService.extractOrganizationId(token)).isEqualTo(principal.getOrganizationId());
    }

    @Test
    void rejectsTamperedToken() {
        String token = jwtService.generateToken(principal);
        String tampered = token.substring(0, token.length() - 2) + "xx";

        assertThat(jwtService.isValid(tampered)).isFalse();
    }
}
