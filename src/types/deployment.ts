export interface DeploymentError {
  id: string;
  step: string;
  type: "network" | "compilation" | "account" | "contract" | "system" | "user";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  details: string;
  technicalDetails?: string;
  stackTrace?: string;
  timestamp: Date;
  retryable: boolean;
  suggestedFix?: string;
  relatedLinks?: Array<{ title: string; url: string }>;
  context?: Record<string, any>;
}

export interface DeploymentLog {
  id: string;
  timestamp: Date;
  level: "debug" | "info" | "warn" | "error";
  step: string;
  message: string;
  data?: any;
  error?: DeploymentError;
}
