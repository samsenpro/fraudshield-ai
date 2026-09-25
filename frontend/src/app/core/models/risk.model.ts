export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Decision = 'APPROVE' | 'REVIEW' | 'BLOCK';

export interface RiskSignal {
  code: string;
  severity: RiskLevel;
  score: number | null;
}

export interface RiskAssessment {
  transactionId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  decision: Decision;
  confidence: number;
  signals: RiskSignal[];
  modelVersion: string | null;
  processingTimeMs: number;
}
