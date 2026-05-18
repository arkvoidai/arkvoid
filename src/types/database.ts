export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface UserScopedRow {
  id: string;
  user_id: string;
  created_at?: string | null;
}

export interface Agent extends UserScopedRow {
  org_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  agent_type?: string | null;
  status?: 'active' | 'inactive' | 'paused' | string;
  fingerprint?: string | null;
  metadata?: Json;
  risk_threshold?: number | null;
  risk_score?: number | null;
  created_by?: string | null;
}

export interface Trace extends UserScopedRow {
  org_id?: string | null;
  agent_id: string;
  trace_id: string;
  action_type: string;
  risk_score?: number | null;
  risk_level?: 'low' | 'medium' | 'high' | 'critical' | string | null;
  latency_ms?: number | null;
  input_hash?: string | null;
  output_hash?: string | null;
  input_preview?: string | null;
  output_preview?: string | null;
  status?: string | null;
  started_at?: string | null;
  created_at?: string | null;
  is_anomaly?: boolean | null;
  agents?: Pick<Agent, 'name' | 'slug'> | null;
}

export interface ComplianceEvent extends UserScopedRow {
  score?: number | null;
  category?: string | null;
  status?: string | null;
  details?: Json;
}

export interface APIKey {
  id: string;
  user_id?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  name: string;
  key_prefix: string;
  scopes?: string[] | null;
  is_active?: boolean | null;
  last_used_at?: string | null;
}

export interface Policy extends UserScopedRow {
  name: string;
  description?: string | null;
  is_active?: boolean | null;
  condition_field: string;
  condition_operator: string;
  condition_value: string;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | string;
  triggered_count?: number | null;
}

export interface ReviewGate extends UserScopedRow {
  agent_id?: string | null;
  trace_id?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  expires_at?: string | null;
  action_data?: Json;
}

export interface Webhook extends UserScopedRow {
  name: string;
  url: string;
  secret?: string;
  events: string[];
  is_active?: boolean | null;
  delivery_count?: number | null;
  failure_count?: number | null;
  last_delivered_at?: string | null;
}

export type Result<T> = { data: T; error: null } | { data: null; error: string };
