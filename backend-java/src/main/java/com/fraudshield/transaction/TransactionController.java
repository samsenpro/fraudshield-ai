package com.fraudshield.transaction;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fraudshield.organization.OrganizationRepository;
import com.fraudshield.risk.RiskAssessmentService;
import com.fraudshield.risk.dto.RiskAssessmentResponse;
import com.fraudshield.transaction.dto.CreateTransactionRequest;
import com.fraudshield.transaction.dto.TransactionResponse;
import com.fraudshield.user.UserPrincipal;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final RiskAssessmentService riskAssessmentService;
    private final OrganizationRepository organizationRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'USER')")
    public ResponseEntity<TransactionResponse> create(
            @Valid @RequestBody CreateTransactionRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @AuthenticationPrincipal UserPrincipal principal) {

        var organization = organizationRepository.getReferenceById(principal.getOrganizationId());
        Transaction transaction = transactionService.create(request, organization, idempotencyKey);

        return ResponseEntity.status(HttpStatus.CREATED).body(TransactionResponse.from(transaction));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'REVIEWER', 'USER')")
    public Page<TransactionResponse> list(@AuthenticationPrincipal UserPrincipal principal, Pageable pageable) {
        return transactionService.listForOrganization(principal.getOrganizationId(), pageable)
                .map(TransactionResponse::from);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'REVIEWER', 'USER')")
    public TransactionResponse getById(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        Transaction transaction = transactionService.getForOrganization(id, principal.getOrganizationId());
        return TransactionResponse.from(transaction);
    }

    @GetMapping("/{id}/risk")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'REVIEWER')")
    public RiskAssessmentResponse getRisk(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        transactionService.getForOrganization(id, principal.getOrganizationId());
        return riskAssessmentService.getForTransaction(id);
    }
}
