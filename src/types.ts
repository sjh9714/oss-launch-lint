export type CheckStatus = "pass" | "warn" | "fail";

export interface AuditCheck {
  id: string;
  title: string;
  status: CheckStatus;
  message: string;
  recommendation?: string;
}

export interface AuditSummary {
  pass: number;
  warn: number;
  fail: number;
}

export interface AuditResult {
  repoPath: string;
  generatedAt: string;
  score: number;
  summary: AuditSummary;
  checks: AuditCheck[];
  topics: string[];
  nextActions: string[];
}

export interface PublicAuditJson {
  score: number;
  summary: AuditSummary;
  checks: AuditCheck[];
  topics: string[];
  nextActions: string[];
}
