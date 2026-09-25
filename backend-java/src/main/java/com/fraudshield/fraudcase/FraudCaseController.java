package com.fraudshield.fraudcase;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fraudshield.fraudcase.dto.CreateFraudCaseRequest;
import com.fraudshield.fraudcase.dto.FraudCaseResponse;
import com.fraudshield.fraudcase.dto.ResolveFraudCaseRequest;
import com.fraudshield.organization.OrganizationRepository;
import com.fraudshield.user.UserPrincipal;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/fraud-cases")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'REVIEWER')")
public class FraudCaseController {

    private final FraudCaseService fraudCaseService;
    private final OrganizationRepository organizationRepository;

    @PostMapping
    public ResponseEntity<FraudCaseResponse> create(
            @Valid @RequestBody CreateFraudCaseRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        var organization = organizationRepository.getReferenceById(principal.getOrganizationId());
        FraudCase fraudCase = fraudCaseService.createFromAlert(request.alertId(), organization);
        return ResponseEntity.status(HttpStatus.CREATED).body(FraudCaseResponse.from(fraudCase));
    }

    @GetMapping
    public Page<FraudCaseResponse> list(@AuthenticationPrincipal UserPrincipal principal, Pageable pageable) {
        return fraudCaseService.listForOrganization(principal.getOrganizationId(), pageable)
                .map(FraudCaseResponse::from);
    }

    @GetMapping("/{id}")
    public FraudCaseResponse getById(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return FraudCaseResponse.from(fraudCaseService.getForOrganization(id, principal.getOrganizationId()));
    }

    @PostMapping("/{id}/review")
    public FraudCaseResponse review(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        var organization = organizationRepository.getReferenceById(principal.getOrganizationId());
        FraudCase fraudCase = fraudCaseService.assignToReviewer(id, organization, principal.getUserId());
        return FraudCaseResponse.from(fraudCase);
    }

    @PatchMapping("/{id}")
    public FraudCaseResponse resolve(
            @PathVariable UUID id,
            @Valid @RequestBody ResolveFraudCaseRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        var organization = organizationRepository.getReferenceById(principal.getOrganizationId());
        FraudCase fraudCase = fraudCaseService.resolve(id, organization, request.decision(), request.notes());
        return FraudCaseResponse.from(fraudCase);
    }
}
