export interface Organization {
  id: string;
  name: string;
  tier: 'free' | 'starter' | 'enterprise';
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  orgId: string;
  role: 'admin' | 'member';
}

export interface Agent {
  id: string;
  orgId: string;
  name: string;
  description: string;
  model: string;
  status: 'active' | 'inactive';
}

export interface PromptVersion {
  id: string;
  agentId: string;
  text: string;
  version: number;
  hash: string;
  createdAt: string;
}

export interface ToolCall {
  id: string;
  traceId: string;
  toolName: string;
  parameters: string; // JSON
  result: string; // JSON
  latencyMs: number;
}

export interface ActionLog {
  id: string;
  traceId: string;
  agentId: string;
  actionType: 'generate' | 'tool_call' | 'approval' | 'data_access';
  timestamp: string;
  details: string; // JSON
}

export interface Trace {
  id: string;
  agentId: string;
  status: 'success' | 'failed' | 'pending_approval';
  modelId: string;
  promptVersionId: string;
  durationMs: number;
  riskScore: number;
  createdAt: string;
}

export interface DataAccessLog {
  id: string;
  traceId: string;
  datasetName: string;
  recordId: string | null;
  accessType: 'read' | 'write' | 'delete';
}

export interface StateDelta {
  id: string;
  traceId: string;
  resourceType: string;
  beforeState: string; // JSON
  afterState: string; // JSON
}

export interface PermissionSet {
  id: string;
  agentId: string;
  allowedTools: string[];
  allowedDatasets: string[];
  requiresApproval: boolean;
}

export interface CompliancePolicy {
  id: string;
  name: string;
  framework: 'SOC2' | 'GDPR' | 'EU_AI_ACT';
  status: 'passing' | 'failing';
}

export interface Alert {
  id: string;
  orgId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  traceId?: string;
  createdAt: string;
}
