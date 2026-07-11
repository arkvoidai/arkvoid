-- ARKVOID production schema baseline captured for migration tracking.
-- This file intentionally contains schema only and should not be edited by hand
-- after the baseline; future changes belong in new supabase/migrations/*.sql files.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core tenant and identity tables
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  billing_email TEXT,
  action_count_month INTEGER NOT NULL DEFAULT 0,
  action_limit_month INTEGER NOT NULL DEFAULT 1000,
  agent_limit INTEGER NOT NULL DEFAULT 3,
  retention_days INTEGER NOT NULL DEFAULT 30,
  stripe_customer_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  plan TEXT NOT NULL DEFAULT 'FREE',
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  plan TEXT NOT NULL DEFAULT 'FREE',
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product data
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  agent_type TEXT NOT NULL DEFAULT 'assistant',
  status TEXT NOT NULL DEFAULT 'active',
  fingerprint TEXT UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  UNIQUE(org_id, slug)
);

CREATE TABLE IF NOT EXISTS model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_tag TEXT,
  content_hash TEXT NOT NULL,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  diff_from_previous TEXT,
  UNIQUE(agent_id, version_number)
);

CREATE TABLE IF NOT EXISTS action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  session_id UUID,
  trace_id TEXT UNIQUE NOT NULL,
  parent_trace_id TEXT,
  action_type TEXT NOT NULL DEFAULT 'inference',
  action TEXT,
  risk_level TEXT,
  risk_analyzed BOOLEAN NOT NULL DEFAULT false,
  model_provider TEXT,
  model_name TEXT,
  model_temperature NUMERIC,
  prompt_version_id UUID REFERENCES prompt_versions(id) ON DELETE SET NULL,
  prompt_version_tag TEXT,
  prompt_hash TEXT,
  approval_context JSONB,
  error_message TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  input_hash TEXT,
  output_hash TEXT,
  input_preview TEXT,
  output_preview TEXT,
  latency_ms INTEGER,
  permission_snapshot JSONB,
  required_human_approval BOOLEAN NOT NULL DEFAULT false,
  human_approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  human_approved_at TIMESTAMPTZ,
  risk_score NUMERIC NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  policy_violations JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'completed',
  environment TEXT NOT NULL DEFAULT 'production',
  sdk_version TEXT,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_log_id UUID REFERENCES action_logs(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  call_index INTEGER,
  input_preview JSONB,
  output_preview JSONB,
  external_system TEXT,
  latency_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'success',
  called_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_log_id UUID REFERENCES action_logs(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  data_source TEXT NOT NULL,
  data_classification TEXT NOT NULL DEFAULT 'internal',
  contains_pii BOOLEAN NOT NULL DEFAULT false,
  records_accessed INTEGER,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS state_deltas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_log_id UUID REFERENCES action_logs(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  system_name TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  change_type TEXT NOT NULL,
  field_path TEXT,
  value_before JSONB,
  value_after JSONB,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  action_log_id UUID REFERENCES action_logs(id) ON DELETE CASCADE,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  condition_field TEXT NOT NULL,
  condition_operator TEXT NOT NULL,
  condition_value TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'flag',
  severity TEXT NOT NULL DEFAULT 'medium',
  triggered_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Billing, usage, sessions, integrations, observability, and marketing tables
CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  plan TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT 'INR',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  period_end DATE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guest_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_device_id TEXT NOT NULL,
  fingerprint_hash TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT now(),
  expired BOOLEAN NOT NULL DEFAULT false,
  converted_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS demo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  fingerprint_hash TEXT,
  ip_hash TEXT,
  usage_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS connected_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_account_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  scopes TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_synced TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(user_id, provider, external_account_id)
);

CREATE TABLE IF NOT EXISTS github_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  github_username TEXT,
  github_user_id TEXT,
  access_token TEXT,
  token_type TEXT DEFAULT 'bearer',
  scope TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_synced TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS github_repos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  github_connection_id UUID REFERENCES github_connections(id) ON DELETE CASCADE,
  repo_name TEXT,
  repo_full_name TEXT,
  repo_id TEXT,
  is_monitoring BOOLEAN NOT NULL DEFAULT false,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  country TEXT,
  region TEXT,
  city TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  ip_hash TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  path TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plg_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  signal_type TEXT NOT NULL,
  score NUMERIC,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS uptime_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  status TEXT NOT NULL,
  response_time_ms INTEGER,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  cadence TEXT NOT NULL DEFAULT 'weekly',
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shared_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  role TEXT,
  use_case TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_action_logs_org ON action_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_agent ON action_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_user ON action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_started ON action_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_logs_risk ON action_logs(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_org ON alerts(org_id, status);
CREATE INDEX IF NOT EXISTS idx_agents_user ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_guest_device_id ON guest_sessions(guest_device_id);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_fingerprint_hash ON guest_sessions(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period ON usage_tracking(user_id, usage_type, period_start);

-- Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_deltas ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_repos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plg_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE uptime_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_profile" ON user_profiles FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_own_profile" ON profiles FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "org_members_read_org" ON organizations FOR SELECT USING (id IN (SELECT org_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "super_admin_all_orgs" ON organizations FOR ALL USING ((SELECT is_super_admin FROM user_profiles WHERE id = auth.uid()) = true OR id IN (SELECT org_id FROM user_profiles WHERE id = auth.uid())) WITH CHECK ((SELECT is_super_admin FROM user_profiles WHERE id = auth.uid()) = true OR id IN (SELECT org_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "org_isolation_agents" ON agents FOR ALL USING (org_id IN (SELECT org_id FROM user_profiles WHERE id = auth.uid()) OR user_id = auth.uid()) WITH CHECK (org_id IN (SELECT org_id FROM user_profiles WHERE id = auth.uid()) OR user_id = auth.uid());
CREATE POLICY "org_isolation_logs" ON action_logs FOR SELECT USING (org_id IN (SELECT org_id FROM user_profiles WHERE id = auth.uid()) OR user_id = auth.uid());
CREATE POLICY "users_own_api_keys" ON api_keys FOR ALL USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "allow_anon_insert_guest_sessions" ON guest_sessions FOR INSERT WITH CHECK (auth.role() = 'anon');
CREATE POLICY "allow_anon_select_guest_sessions" ON guest_sessions FOR SELECT USING (auth.role() = 'anon');
CREATE POLICY "allow_anon_update_guest_sessions" ON guest_sessions FOR UPDATE USING (auth.role() = 'anon');
CREATE POLICY "allow_newsletter_insert" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_waitlist_insert" ON waitlist FOR INSERT WITH CHECK (true);

-- Functions mirrored from production for application RPC compatibility.
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT up.is_super_admin FROM user_profiles up WHERE up.id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_user_org_id(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM user_profiles WHERE id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION get_org_stats(p_org_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_org UUID := COALESCE(p_org_id, get_my_org_id());
BEGIN
  RETURN jsonb_build_object(
    'agents', (SELECT count(*) FROM agents WHERE org_id = target_org),
    'traces', (SELECT count(*) FROM action_logs WHERE org_id = target_org),
    'alerts', (SELECT count(*) FROM alerts WHERE org_id = target_org AND status = 'open')
  );
END;
$$;

CREATE OR REPLACE FUNCTION create_organization_with_admin(p_name TEXT, p_slug TEXT, p_user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  INSERT INTO organizations(name, slug) VALUES (p_name, p_slug) RETURNING id INTO v_org_id;
  UPDATE user_profiles SET org_id = v_org_id, role = 'admin' WHERE id = p_user_id;
  RETURN v_org_id;
END;
$$;

CREATE OR REPLACE FUNCTION check_trace_limit(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org organizations%ROWTYPE;
BEGIN
  SELECT o.* INTO v_org FROM organizations o JOIN user_profiles up ON up.org_id = o.id WHERE up.id = p_user_id;
  IF v_org.id IS NULL THEN
    RETURN jsonb_build_object('allowed', true, 'plan', 'FREE', 'used', 0, 'limit', 1000);
  END IF;
  RETURN jsonb_build_object('allowed', v_org.action_count_month < v_org.action_limit_month, 'plan', v_org.plan, 'used', v_org.action_count_month, 'limit', v_org.action_limit_month);
END;
$$;

CREATE OR REPLACE FUNCTION create_trace(p_user_id UUID, p_agent_id UUID, p_org_id UUID, p_trace_id TEXT, p_action TEXT, p_risk_score NUMERIC DEFAULT 0, p_metadata JSONB DEFAULT '{}'::jsonb)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO action_logs(user_id, agent_id, org_id, trace_id, action_type, action, risk_score, extra)
  VALUES (p_user_id, p_agent_id, p_org_id, p_trace_id, p_action, p_action, LEAST(GREATEST(COALESCE(p_risk_score, 0), 0), 100), p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION verify_trace(p_trace_id TEXT)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT jsonb_build_object('verified', true, 'trace_id', trace_id, 'created_at', created_at) FROM action_logs WHERE trace_id = p_trace_id), jsonb_build_object('verified', false));
$$;

CREATE OR REPLACE FUNCTION increment_agent_actions(p_agent_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE organizations SET action_count_month = action_count_month + 1 WHERE id = (SELECT org_id FROM agents WHERE id = p_agent_id);
END;
$$;

CREATE OR REPLACE FUNCTION increment_guest_usage(p_guest_device_id TEXT, p_fingerprint_hash TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO guest_sessions(guest_device_id, fingerprint_hash, usage_count)
  VALUES (p_guest_device_id, p_fingerprint_hash, 1)
  ON CONFLICT DO NOTHING;
  UPDATE guest_sessions SET usage_count = usage_count + 1, last_active = now() WHERE guest_device_id = p_guest_device_id OR fingerprint_hash = p_fingerprint_hash;
END;
$$;

CREATE OR REPLACE FUNCTION increment_trace_usage(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE organizations SET action_count_month = action_count_month + 1 WHERE id = (SELECT org_id FROM user_profiles WHERE id = p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION reset_monthly_action_counts()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE organizations SET action_count_month = 0;
$$;

CREATE OR REPLACE FUNCTION set_api_key_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_active := COALESCE(NEW.is_active, true);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_profile_to_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles(id, org_id, email, full_name, avatar_url, role, plan, is_super_admin, created_at, updated_at)
  VALUES (NEW.id, NEW.org_id, NEW.email, NEW.full_name, NEW.avatar_url, NEW.role, NEW.plan, NEW.is_super_admin, NEW.created_at, NEW.updated_at)
  ON CONFLICT (id) DO UPDATE SET org_id = EXCLUDED.org_id, email = EXCLUDED.email, full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url, role = EXCLUDED.role, plan = EXCLUDED.plan, is_super_admin = EXCLUDED.is_super_admin, updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_profiles(id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION auto_flag_high_risk()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.risk_score >= 80 THEN
    INSERT INTO alerts(org_id, action_log_id, severity, title, description)
    VALUES (NEW.org_id, NEW.id, 'high', 'High-risk action detected', 'Trace risk score exceeded the high-risk threshold.');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION expire_demo_sessions()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE demo_sessions SET expires_at = COALESCE(expires_at, now()), last_active = last_active WHERE expires_at IS NOT NULL AND expires_at < now();
$$;

CREATE OR REPLACE FUNCTION insert_data_access_logs(p_action_log_id UUID, p_org_id UUID, p_logs JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO data_access_logs(action_log_id, org_id, data_source, data_classification, contains_pii, records_accessed)
  SELECT p_action_log_id, p_org_id, value->>'data_source', COALESCE(value->>'data_classification', 'internal'), COALESCE((value->>'contains_pii')::boolean, false), NULLIF(value->>'records_accessed', '')::integer
  FROM jsonb_array_elements(COALESCE(p_logs, '[]'::jsonb));
END;
$$;

CREATE OR REPLACE FUNCTION insert_tool_calls(p_action_log_id UUID, p_org_id UUID, p_calls JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO tool_calls(action_log_id, org_id, tool_name, call_index, input_preview, output_preview, external_system, latency_ms, status)
  SELECT p_action_log_id, p_org_id, value->>'tool_name', NULLIF(value->>'call_index', '')::integer, value->'input_preview', value->'output_preview', value->>'external_system', NULLIF(value->>'latency_ms', '')::integer, COALESCE(value->>'status', 'success')
  FROM jsonb_array_elements(COALESCE(p_calls, '[]'::jsonb));
END;
$$;

CREATE OR REPLACE FUNCTION generate_api_key(p_user_id UUID, p_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org UUID;
  v_key TEXT := 'ARK_' || encode(gen_random_bytes(24), 'hex');
  v_hash TEXT := encode(digest(v_key, 'sha256'), 'hex');
BEGIN
  SELECT org_id INTO v_org FROM user_profiles WHERE id = p_user_id;
  INSERT INTO api_keys(org_id, name, key_hash, key_prefix, created_by) VALUES (v_org, p_name, v_hash, left(v_key, 8), p_user_id);
  RETURN jsonb_build_object('key', v_key, 'prefix', left(v_key, 8));
END;
$$;

CREATE TRIGGER trg_sync_user_profiles_to_profiles
AFTER INSERT OR UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION sync_profile_to_profiles();

CREATE TRIGGER trg_auto_flag_high_risk
AFTER INSERT ON action_logs
FOR EACH ROW EXECUTE FUNCTION auto_flag_high_risk();
