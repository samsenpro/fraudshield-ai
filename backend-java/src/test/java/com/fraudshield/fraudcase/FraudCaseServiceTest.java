package com.fraudshield.fraudcase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fraudshield.alert.Alert;
import com.fraudshield.alert.AlertService;
import com.fraudshield.alert.AlertStatus;
import com.fraudshield.audit.AuditService;
import com.fraudshield.config.FraudMetrics;
import com.fraudshield.exception.ApiException;
import com.fraudshield.organization.Organization;
import com.fraudshield.risk.RiskLevel;
import com.fraudshield.transaction.Transaction;
import com.fraudshield.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class FraudCaseServiceTest {

    @Mock
    private FraudCaseRepository fraudCaseRepository;
    @Mock
    private AlertService alertService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AuditService auditService;
    @Mock
    private FraudMetrics fraudMetrics;

    private FraudCaseService service;
    private Organization organization;
    private Alert alert;

    @BeforeEach
    void setUp() {
        service = new FraudCaseService(fraudCaseRepository, alertService, userRepository, auditService, fraudMetrics);

        organization = Organization.builder().build();
        organization.setId(UUID.randomUUID());

        Transaction transaction = Transaction.builder().organization(organization).build();
        transaction.setId(UUID.randomUUID());

        alert = Alert.builder()
                .transaction(transaction)
                .organization(organization)
                .severity(RiskLevel.HIGH)
                .status(AlertStatus.OPEN)
                .reason("test")
                .build();
        alert.setId(UUID.randomUUID());
    }

    @Test
    void createsACaseFromAnOpenAlertAndMovesItToInvestigating() {
        when(alertService.getForOrganization(alert.getId(), organization.getId())).thenReturn(alert);
        when(fraudCaseRepository.findByAlertId(alert.getId())).thenReturn(Optional.empty());
        when(fraudCaseRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        FraudCase fraudCase = service.createFromAlert(alert.getId(), organization);

        assertThat(fraudCase.getStatus()).isEqualTo(FraudCaseStatus.OPEN);
        assertThat(fraudCase.getAlert()).isEqualTo(alert);
    }

    @Test
    void refusesToOpenASecondCaseForTheSameAlert() {
        when(alertService.getForOrganization(alert.getId(), organization.getId())).thenReturn(alert);
        when(fraudCaseRepository.findByAlertId(alert.getId()))
                .thenReturn(Optional.of(FraudCase.builder().build()));

        assertThatThrownBy(() -> service.createFromAlert(alert.getId(), organization))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void onlyAnOpenCaseCanBeAssignedForReview() {
        FraudCase resolvedCase = existingCase(FraudCaseStatus.RESOLVED);
        when(fraudCaseRepository.findDetailedById(resolvedCase.getId())).thenReturn(Optional.of(resolvedCase));

        assertThatThrownBy(() -> service.assignToReviewer(resolvedCase.getId(), organization, UUID.randomUUID()))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void onlyACaseInReviewCanBeResolved() {
        FraudCase openCase = existingCase(FraudCaseStatus.OPEN);
        when(fraudCaseRepository.findDetailedById(openCase.getId())).thenReturn(Optional.of(openCase));

        assertThatThrownBy(
                () -> service.resolve(openCase.getId(), organization, FraudCaseDecision.CONFIRMED_FRAUD, "notes"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void resolvingACaseAlsoResolvesItsAlert() {
        FraudCase inReviewCase = existingCase(FraudCaseStatus.IN_REVIEW);
        inReviewCase.setAlert(alert);
        when(fraudCaseRepository.findDetailedById(inReviewCase.getId())).thenReturn(Optional.of(inReviewCase));
        when(fraudCaseRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        FraudCase resolved = service.resolve(
                inReviewCase.getId(), organization, FraudCaseDecision.FALSE_POSITIVE, "turned out fine");

        assertThat(resolved.getStatus()).isEqualTo(FraudCaseStatus.RESOLVED);
        assertThat(resolved.getDecision()).isEqualTo(FraudCaseDecision.FALSE_POSITIVE);
        assertThat(resolved.getResolvedAt()).isNotNull();
    }

    private FraudCase existingCase(FraudCaseStatus status) {
        FraudCase fraudCase = FraudCase.builder()
                .transaction(alert.getTransaction())
                .organization(organization)
                .status(status)
                .build();
        fraudCase.setId(UUID.randomUUID());
        return fraudCase;
    }
}
