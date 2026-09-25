export type FraudCaseStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
export type FraudCaseDecision = 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'UNDETERMINED';

export interface FraudCase {
  id: string;
  alertId: string | null;
  transactionId: string;
  status: FraudCaseStatus;
  assignedReviewerId: string | null;
  assignedReviewerName: string | null;
  notes: string | null;
  decision: FraudCaseDecision | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface ResolveFraudCaseRequest {
  decision: FraudCaseDecision;
  notes?: string;
}
