
-- ============================================
-- WorkForce AI — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS (synced from Clerk via webhook)
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CREDIT WALLETS
-- ============================================
CREATE TABLE public.credit_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total_credits INTEGER NOT NULL DEFAULT 50,
  used_credits INTEGER NOT NULL DEFAULT 0,
  last_refill TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT used_lte_total CHECK (used_credits <= total_credits)
);

CREATE UNIQUE INDEX credit_wallets_user_id_idx ON public.credit_wallets(user_id);

-- Helper view
CREATE VIEW public.credit_wallets_with_remaining AS
SELECT *, (total_credits - used_credits) AS remaining_credits
FROM public.credit_wallets;

-- ============================================
-- AGENTS
-- ============================================
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('developer', 'teacher', 'business', 'creator')),
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('low', 'medium', 'high')),
  credit_cost INTEGER NOT NULL DEFAULT 3,
  icon TEXT NOT NULL DEFAULT '🤖',
  input_schema JSONB NOT NULL DEFAULT '{}',
  prompt_template TEXT,
  n8n_webhook_path TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  requires_plan TEXT NOT NULL DEFAULT 'free' CHECK (requires_plan IN ('free', 'pro', 'enterprise')),
  run_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default agents
INSERT INTO public.agents (slug, title, description, category, difficulty, credit_cost, icon, requires_plan) VALUES
  ('linkedin-tech-post', 'LinkedIn Tech Post', 'Turn your GitHub repo into a compelling LinkedIn post with hashtags and engagement hooks.', 'developer', 'medium', 3, '🔗', 'free'),
  ('resume-ats-optimizer', 'Resume ATS Optimizer', 'Analyze and rewrite your resume to pass ATS filters and impress hiring managers.', 'developer', 'high', 5, '📄', 'free'),
  ('github-portfolio', 'GitHub Portfolio Generator', 'Generate a stunning profile README from your GitHub repos and activity.', 'developer', 'medium', 3, '🏆', 'free'),
  ('meeting-notes-ai', 'Meeting Notes AI', 'Transform a meeting transcript or recording into structured notes, action items, and a summary.', 'business', 'medium', 4, '🎙️', 'free'),
  ('assignment-verifier', 'Assignment Verifier', 'Check student submissions for plagiarism, AI usage, and quality scoring with detailed feedback.', 'teacher', 'medium', 4, '✅', 'free'),
  ('social-media-pack', 'Social Media Pack', 'Create a week of platform-optimized posts across Twitter, LinkedIn, and Instagram from one idea.', 'creator', 'low', 2, '📱', 'free');

-- ============================================
-- WORKFLOWS (execution history)
-- ============================================
CREATE TABLE public.workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  input_data JSONB NOT NULL DEFAULT '{}',
  output_data JSONB,
  error_message TEXT,
  credits_used INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  trigger_job_id TEXT,
  n8n_execution_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX workflows_user_id_idx ON public.workflows(user_id);
CREATE INDEX workflows_status_idx ON public.workflows(status);
CREATE INDEX workflows_created_at_idx ON public.workflows(created_at DESC);

-- ============================================
-- CREDIT LEDGER (immutable audit trail)
-- ============================================
CREATE TABLE public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES public.workflows(id),
  agent_id UUID REFERENCES public.agents(id),
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debit', 'credit', 'refund', 'bonus', 'monthly_reset')),
  description TEXT,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX credit_ledger_user_id_idx ON public.credit_ledger(user_id);

-- ============================================
-- CONNECTIONS (OAuth tokens)
-- ============================================
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'gmail', 'google_calendar', 'linkedin', 'twitter', 'notion', 'google_drive')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  provider_user_id TEXT,
  provider_username TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- ============================================
-- SUGGESTIONS
-- ============================================
CREATE TABLE public.suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('developer', 'teacher', 'business', 'creator')),
  estimated_complexity TEXT CHECK (estimated_complexity IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SCHEDULED WORKFLOWS
-- ============================================
CREATE TABLE public.scheduled_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id),
  name TEXT NOT NULL,
  input_data JSONB NOT NULL DEFAULT '{}',
  cron_expression TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  trigger_schedule_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_workflows ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
CREATE POLICY "users_own" ON public.users
  FOR ALL USING (clerk_id = current_setting('app.clerk_user_id', TRUE));

-- Credit wallets: own only
CREATE POLICY "wallets_own" ON public.credit_wallets
  FOR ALL USING (user_id = (SELECT id FROM public.users WHERE clerk_id = current_setting('app.clerk_user_id', TRUE)));

-- Workflows: own only
CREATE POLICY "workflows_own" ON public.workflows
  FOR ALL USING (user_id = (SELECT id FROM public.users WHERE clerk_id = current_setting('app.clerk_user_id', TRUE)));

-- Credit ledger: read own only
CREATE POLICY "ledger_own" ON public.credit_ledger
  FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE clerk_id = current_setting('app.clerk_user_id', TRUE)));

-- Connections: own only
CREATE POLICY "connections_own" ON public.connections
  FOR ALL USING (user_id = (SELECT id FROM public.users WHERE clerk_id = current_setting('app.clerk_user_id', TRUE)));

-- Suggestions: own read/write
CREATE POLICY "suggestions_own" ON public.suggestions
  FOR ALL USING (user_id = (SELECT id FROM public.users WHERE clerk_id = current_setting('app.clerk_user_id', TRUE)));

-- Agents: public read
CREATE POLICY "agents_public_read" ON public.agents
  FOR SELECT USING (is_enabled = TRUE);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create wallet when user is created
CREATE OR REPLACE FUNCTION public.create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.credit_wallets (user_id, total_credits)
  VALUES (NEW.id, CASE WHEN NEW.plan = 'pro' THEN 1000 ELSE 50 END);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_user();

-- Deduct credits atomically
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_workflow_id UUID,
  p_agent_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_remaining INTEGER;
  v_balance_after INTEGER;
BEGIN
  SELECT (total_credits - used_credits) INTO v_remaining
  FROM public.credit_wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_remaining < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE public.credit_wallets
  SET used_credits = used_credits + p_amount
  WHERE user_id = p_user_id;

  SELECT (total_credits - used_credits) INTO v_balance_after
  FROM public.credit_wallets WHERE user_id = p_user_id;

  INSERT INTO public.credit_ledger (user_id, workflow_id, agent_id, amount, type, description, balance_after)
  VALUES (p_user_id, p_workflow_id, p_agent_id, p_amount, 'debit', p_description, v_balance_after);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER connections_updated_at BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Increment agent run count
CREATE OR REPLACE FUNCTION public.increment_agent_run_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.agents SET run_count = run_count + 1 WHERE id = NEW.agent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_workflow_completed
  AFTER UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.increment_agent_run_count();
