package com.fraudshield.alert;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fraudshield.alert.dto.AlertResponse;
import com.fraudshield.user.UserPrincipal;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/alerts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'REVIEWER')")
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public Page<AlertResponse> list(@AuthenticationPrincipal UserPrincipal principal, Pageable pageable) {
        return alertService.listForOrganization(principal.getOrganizationId(), pageable).map(AlertResponse::from);
    }

    @GetMapping("/{id}")
    public AlertResponse getById(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return AlertResponse.from(alertService.getForOrganization(id, principal.getOrganizationId()));
    }
}
