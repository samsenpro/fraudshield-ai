import { RiskLevel } from './risk.model';

export type AlertStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';

export interface Alert {
  id: string;
  transactionId: string;
  severity: RiskLevel;
  status: AlertStatus;
  reason: string;
  createdAt: string;
  resolvedAt: string | null;
}
