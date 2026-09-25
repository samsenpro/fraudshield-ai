import { FraudCaseStatus } from './fraud-case.model';
import { RiskLevel } from './risk.model';

export interface DailyCount {
  date: string;
  count: number;
}

export interface AnalyticsResponse {
  transactionsAnalyzed: number;
  approved: number;
  underReview: number;
  blocked: number;
  fraudAlerts: number;
  fraudCases: number;
  falsePositives: number;
  averageRiskScore: number;
  averageAnalysisTimeMs: number;
  transactionsOverTime: DailyCount[];
  riskDistribution: Partial<Record<RiskLevel, number>>;
  alertsBySeverity: Partial<Record<RiskLevel, number>>;
  fraudCasesByStatus: Partial<Record<FraudCaseStatus, number>>;
}
