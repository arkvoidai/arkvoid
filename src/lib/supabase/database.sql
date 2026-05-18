CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free',
  billing_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{}'
);

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  org_id UUID REFERENCES organizations(id),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member',
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  agent_type TEXT DEFAULT 'assistant',
  status TEXT DEFAULT 'active',
  fingerprint TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  UNIQUE(org_id, slug)
);

CREATE TABLE model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES user_profiles(id),
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  agent_id UUID REFERENCES agents(id),
  version_number INTEGER NOT NULL,
  version_tag TEXT,
  content_hash TEXT NOT NULL,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  diff_from_previous TEXT,
  UNIQUE(agent_id, version_number)
);

CREATE TABLE action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  agent_id UUID REFERENCES agents(id) NOT NULL,
  session_id UUID NOT NULL,
  trace_id TEXT UNIQUE NOT NULL,
  parent_trace_id TEXT,
  model_provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  prompt_version_id UUID REFERENCES prompt_versions(id),
  prompt_hash TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  action_type TEXT NOT NULL DEFAULT 'inference',
  input_hash TEXT,
  output_hash TEXT,
  input_preview TEXT,
  output_preview TEXT,
  latency_ms INTEGER,
  permission_snapshot JSONB,
  required_human_approval BOOLEAN DEFAULT FALSE,
  human_approved_by UUID REFERENCES user_profiles(id),
  human_approved_at TIMESTAMPTZ,
  risk_score FLOAT DEFAULT 0,
  risk_flags JSONB DEFAULT '[]',
  policy_violations JSONB DEFAULT '[]',
  status TEXT DEFAULT 'completed',
  environment TEXT DEFAULT 'production',
  sdk_version TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  tags JSONB DEFAULT '[]'
);

CREATE TABLE tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_log_id UUID REFERENCES action_logs(id) NOT NULL,
  org_id UUID REFERENCES organizations(id) NOT NULL,
  tool_name TEXT NOT NULL,
  call_index INTEGER,
  input_preview JSONB,
  output_preview JSONB,
  external_system TEXT,
  latency_ms INTEGER,
  status TEXT DEFAULT 'success',
  called_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_log_id UUID REFERENCES action_logs(id),
  org_id UUID REFERENCES organizations(id),
  data_source TEXT NOT NULL,
  data_classification TEXT DEFAULT 'internal',
  contains_pii BOOLEAN DEFAULT FALSE,
  records_accessed INTEGER,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE state_deltas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_log_id UUID REFERENCES action_logs(id),
  org_id UUID REFERENCES organizations(id),
  system_name TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  change_type TEXT NOT NULL,
  field_path TEXT,
  value_before JSONB,
  value_after JSONB,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  action_log_id UUID REFERENCES action_logs(id),
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES user_profiles(id)
);

-- Indexes
CREATE INDEX idx_action_logs_org ON action_logs(org_id);
CREATE INDEX idx_action_logs_agent ON action_logs(agent_id);
CREATE INDEX idx_action_logs_started ON action_logs(started_at DESC);
CREATE INDEX idx_action_logs_risk ON action_logs(risk_score DESC);
CREATE INDEX idx_alerts_org ON alerts(org_id, status);

-- Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_deltas ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_org" ON user_profiles
  USING (id = auth.uid());

CREATE POLICY "org_isolation_agents" ON agents
  USING (org_id IN (
    SELECT org_id FROM user_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "org_isolation_logs" ON action_logs
  USING (org_id IN (
    SELECT org_id FROM user_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "users_own_api_keys" ON api_keys
  FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Super admin bypass (manishtalukdar666@gmail.com)
CREATE POLICY "super_admin_all_orgs" ON organizations
  USING (
    (SELECT is_super_admin FROM user_profiles WHERE id = auth.uid()) = TRUE
    OR id IN (SELECT org_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  condition_field TEXT NOT NULL,
  condition_operator TEXT NOT NULL,
  condition_value TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'flag',
  severity TEXT NOT NULL DEFAULT 'medium',
  triggered_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
CREATE TABLE github_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  github_username TEXT,
  github_user_id TEXT,
  access_token TEXT,
  token_type TEXT DEFAULT 'bearer',
  scope TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced TIMESTAMPTZ
);

CREATE TABLE github_repos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  github_connection_id UUID REFERENCES github_connections(id) ON DELETE CASCADE,
  repo_name TEXT,
  repo_full_name TEXT,
  repo_id TEXT,
  is_monitoring BOOLEAN DEFAULT FALSE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_repos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_github" ON github_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_repos" ON github_repos FOR ALL USING (auth.uid() = user_id);

CREATE TABLE agent_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  avg_risk_score DECIMAL(5,2) DEFAULT 0,
  avg_duration_ms DECIMAL(10,2) DEFAULT 0,
  avg_daily_actions DECIMAL(10,2) DEFAULT 0,
  common_actions TEXT[] DEFAULT ARRAY[]::TEXT[],
  baseline_calculated_at TIMESTAMPTZ,
  sample_size INTEGER DEFAULT 0
);

CREATE TABLE anomaly_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  trace_id UUID REFERENCES action_logs(id) ON DELETE CASCADE,
  detected_value DECIMAL,
  expected_value DECIMAL,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_baselines" ON agent_baselines FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_anomalies" ON anomaly_events FOR ALL USING (auth.uid() = user_id);

CREATE TABLE shared_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  report_type TEXT NOT NULL,
  content JSONB NOT NULL,
  org_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);
ALTER TABLE shared_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_shared_reports" ON shared_reports FOR SELECT USING (expires_at > NOW());
CREATE POLICY "own_shared_reports" ON shared_reports FOR ALL USING (auth.uid() = user_id);

CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  events TEXT[] DEFAULT ARRAY['trace.created'],
  is_active BOOLEAN DEFAULT TRUE,
  delivery_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT FALSE,
  duration_ms INTEGER
);

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_webhooks" ON webhooks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_deliveries" ON webhook_deliveries FOR ALL USING (
  webhook_id IN (SELECT id FROM webhooks WHERE user_id = auth.uid())
);

CREATE TABLE review_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  trace_id UUID REFERENCES action_logs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  action_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE review_gates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_gates" ON review_gates
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_notifs" ON notifications
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_notifs_user ON notifications(user_id, created_at DESC);

-- Part 1: Email digests
CREATE TABLE email_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  digest_type TEXT DEFAULT 'daily',
  last_sent_at TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT TRUE
);

ALTER TABLE email_digests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_digests" ON email_digests FOR ALL USING (auth.uid() = user_id);

-- Part 2: Push Notifications
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_push_subs" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- Part 3: Status Page
CREATE TABLE uptime_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'up',
  response_ms INTEGER,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE uptime_logs ENABLE ROW LEVEL SECURITY;
-- Public read access for status page
CREATE POLICY "public_read_uptime" ON uptime_logs FOR SELECT USING (true);

-- Part 4: PLG Signals
CREATE TABLE plg_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  signal_type TEXT NOT NULL,
  fired_at TIMESTAMPTZ DEFAULT NOW(),
  actioned BOOLEAN DEFAULT FALSE
);

ALTER TABLE plg_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_signals" ON plg_signals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_signals" ON plg_signals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin_select" ON plg_signals FOR SELECT USING (true); -- allowed for simplicity in admin MVP
CREATE POLICY "admin_update" ON plg_signals FOR UPDATE USING (true);


