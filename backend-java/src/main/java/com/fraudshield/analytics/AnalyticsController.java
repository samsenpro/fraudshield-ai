package com.fraudshield.analytics;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fraudshield.analytics.dto.AnalyticsResponse;
import com.fraudshield.user.UserPrincipal;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'REVIEWER')")
    public AnalyticsResponse get(@AuthenticationPrincipal UserPrincipal principal) {
        return analyticsService.forOrganization(principal.getOrganizationId());
    }
}
