package com.fraudshield.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fraudshield.audit.AuditAction;
import com.fraudshield.audit.AuditService;
import com.fraudshield.auth.dto.AuthResponse;
import com.fraudshield.auth.dto.LoginRequest;
import com.fraudshield.auth.dto.RegisterRequest;
import com.fraudshield.exception.ApiException;
import com.fraudshield.organization.Organization;
import com.fraudshield.organization.OrganizationRepository;
import com.fraudshield.user.Role;
import com.fraudshield.user.User;
import com.fraudshield.user.UserPrincipal;
import com.fraudshield.user.UserRepository;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AuditService auditService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw ApiException.conflict("A user with this email already exists");
        }
        if (organizationRepository.findByName(request.organizationName()).isPresent()) {
            throw ApiException.conflict("An organization with this name already exists");
        }

        Organization organization = organizationRepository.save(
                Organization.builder().name(request.organizationName()).build());

        User user = userRepository.save(User.builder()
                .organization(organization)
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .role(Role.ADMIN)
                .enabled(true)
                .build());

        String token = jwtService.generateToken(new UserPrincipal(user));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(AuthResponse.bearer(token, user.getEmail(), user.getRole().name()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> ApiException.unauthorized("Invalid credentials"));

        auditService.record(AuditAction.USER_LOGIN, "User", user.getId(), user, user.getOrganization(), null);

        String token = jwtService.generateToken(new UserPrincipal(user));
        return ResponseEntity.ok(AuthResponse.bearer(token, user.getEmail(), user.getRole().name()));
    }
}
