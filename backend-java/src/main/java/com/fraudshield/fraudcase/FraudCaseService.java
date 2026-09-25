package com.fraudshield.fraudcase;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fraudshield.alert.Alert;
import com.fraudshield.alert.AlertService;
import com.fraudshield.audit.AuditAction;
import com.fraudshield.audit.AuditService;
import com.fraudshield.config.FraudMetrics;
import com.fraudshield.exception.ApiException;
import com.fraudshield.organization.Organization;
import com.fraudshield.user.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * Implements the Alert -> Investigation -> FraudCase -> Review -> Resolution
 * flow from section 30. A case is opened manually by a reviewer from an
 * alert (never auto-created), reviewed (assigned), then resolved.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class FraudCaseService {

    private final FraudCaseRepository fraudCaseRepository;
    private final AlertService alertService;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final FraudMetrics fraudMetrics;

    public FraudCase createFromAlert(UUID alertId, Organization organization) {
        Alert alert = alertService.getForOrganization(alertId, organization.getId());

        if (fraudCaseRepository.findByAlertId(alertId).isPresent()) {
            throw ApiException.conflict("This alert already has a fraud case");
        }

        alertService.markUnderInvestigation(alert);

        FraudCase fraudCase = fraudCaseRepository.save(FraudCase.builder()
                .alert(alert)
                .transaction(alert.getTransaction())
                .organization(organization)
                .status(FraudCaseStatus.OPEN)
                .build());

        auditService.record(AuditAction.CASE_CREATED, "FraudCase", fraudCase.getId(), organization);
        fraudMetrics.incrementFraudCases();
        return fraudCase;
    }

    public Page<FraudCase> listForOrganization(UUID organizationId, Pageable pageable) {
        return fraudCaseRepository.findByOrganizationId(organizationId, pageable);
    }

    public FraudCase getForOrganization(UUID caseId, UUID organizationId) {
        FraudCase fraudCase = fraudCaseRepository.findDetailedById(caseId)
                .orElseThrow(() -> ApiException.notFound("Fraud case not found"));
        if (!fraudCase.getOrganization().getId().equals(organizationId)) {
            throw ApiException.notFound("Fraud case not found");
        }
        return fraudCase;
    }

    public FraudCase assignToReviewer(UUID caseId, Organization organization, UUID reviewerId) {
        FraudCase fraudCase = getForOrganization(caseId, organization.getId());
        if (fraudCase.getStatus() != FraudCaseStatus.OPEN) {
            throw ApiException.conflict("Only an OPEN case can be assigned for review");
        }

        // A loaded entity, not getReferenceById: the response maps the reviewer's
        // name after this transaction closes, which an uninitialized proxy can't do.
        fraudCase.setAssignedReviewer(userRepository.findById(reviewerId)
                .orElseThrow(() -> ApiException.notFound("Reviewer not found")));
        fraudCase.setStatus(FraudCaseStatus.IN_REVIEW);
        fraudCaseRepository.save(fraudCase);

        auditService.record(AuditAction.CASE_ASSIGNED, "FraudCase", fraudCase.getId(), organization);
        return fraudCase;
    }

    public FraudCase resolve(UUID caseId, Organization organization, FraudCaseDecision decision, String notes) {
        FraudCase fraudCase = getForOrganization(caseId, organization.getId());
        if (fraudCase.getStatus() != FraudCaseStatus.IN_REVIEW) {
            throw ApiException.conflict("Only a case IN_REVIEW can be resolved");
        }

        fraudCase.setDecision(decision);
        fraudCase.setNotes(notes);
        fraudCase.setStatus(FraudCaseStatus.RESOLVED);
        fraudCase.setResolvedAt(Instant.now());
        fraudCaseRepository.save(fraudCase);

        if (fraudCase.getAlert() != null) {
            alertService.markResolved(fraudCase.getAlert());
        }

        auditService.record(AuditAction.CASE_RESOLVED, "FraudCase", fraudCase.getId(), organization);
        return fraudCase;
    }
}
