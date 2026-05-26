// ============================================
// WorkForce AI — Core Types
// ============================================

export type Plan = 'free' | 'pro' | 'enterprise'
export type AgentCategory = 'developer' | 'teacher' | 'business' | 'creator'
export type AgentDifficulty = 'low' | 'medium' | 'high'
export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export type SuggestionStatus = 'pending' | 'approved' | 'rejected' | 'archived'
export type OAuthProvider = 'github' | 'gmail' | 'google_calendar' | 'linkedin' | 'twitter' | 'notion' | 'google_drive'
export type LedgerType = 'debit' | 'credit' | 'refund' | 'bonus' | 'monthly_reset'

// ============================================
// Database row types
// ============================================

export interface DBUser {
  id: string
  clerk_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: Plan
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface DBCreditWallet {
  id: string
  user_id: string
  total_credits: number
  used_credits: number
  last_refill: string
  remaining_credits?: number // from view
}

export interface DBAgent {
  id: string
  slug: string
  title: string
  description: string
  category: AgentCategory
  difficulty: AgentDifficulty
  credit_cost: number
  icon: string
  input_schema: Record<string, AgentInputField>
  prompt_template: string | null
  n8n_webhook_path: string | null
  is_enabled: boolean
  requires_plan: Plan
  run_count: number
  created_at: string
  updated_at: string
}

export interface DBWorkflow {
  id: string
  user_id: string
  agent_id: string
  status: WorkflowStatus
  input_data: Record<string, unknown>
  output_data: Record<string, unknown> | null
  error_message: string | null
  credits_used: number | null
  input_tokens: number | null
  output_tokens: number | null
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  // joined
  agent?: DBAgent
}

export interface DBCreditLedger {
  id: string
  user_id: string
  workflow_id: string | null
  agent_id: string | null
  amount: number
  type: LedgerType
  description: string | null
  balance_after: number
  created_at: string
}

export interface DBConnection {
  id: string
  user_id: string
  provider: OAuthProvider
  access_token: string
  refresh_token: string | null
  token_expires_at: string | null
  scopes: string[]
  provider_user_id: string | null
  provider_username: string | null
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

export interface DBSuggestion {
  id: string
  user_id: string
  title: string
  description: string
  category: AgentCategory
  estimated_complexity: AgentDifficulty | null
  status: SuggestionStatus
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  // joined
  user?: Pick<DBUser, 'full_name' | 'email'>
}

// ============================================
// Agent Input Schema Types
// ============================================

export interface AgentInputField {
  type: 'text' | 'textarea' | 'select' | 'boolean' | 'file' | 'url'
  label: string
  placeholder?: string
  required?: boolean
  options?: string[]
  maxLength?: number
  default?: string | boolean
  helpText?: string
}

// ============================================
// API Request/Response Types
// ============================================

export interface RunWorkflowRequest {
  agentSlug: string
  inputData: Record<string, unknown>
}

export interface RunWorkflowResponse {
  workflowId: string
  status: WorkflowStatus
  output?: WorkflowOutput
  creditsUsed?: number
  error?: string
}

export interface WorkflowOutput {
  // LinkedIn Tech Post
  post_body?: string
  hashtags?: string[]
  // Resume ATS
  score?: number
  rewritten_resume?: string
  suggestions?: string[]
  // Meeting Notes
  summary?: string
  action_items?: string[]
  decisions?: string[]
  // Social Media Pack
  posts?: { platform: string; content: string }[]
  // GitHub Portfolio
  readme_content?: string
  // Assignment Verifier
  plagiarism_score?: number
  ai_probability?: number
  quality_score?: number
  feedback?: string
  strengths?: string[]
  improvements?: string[]
  // Common
  token_usage?: { input: number; output: number }
  metadata?: Record<string, unknown>
}

export interface CreateSuggestionRequest {
  title: string
  description: string
  category: AgentCategory
  estimated_complexity?: AgentDifficulty
}

// ============================================
// UI / Client types
// ============================================

export interface AgentWithMeta extends DBAgent {
  is_connected?: boolean
  user_can_run?: boolean
}

export interface DashboardStats {
  runs_this_week: number
  credits_used_total: number
  time_saved_hours: number
  remaining_credits: number
  total_credits: number
}

export interface AdminStats {
  total_users: number
  total_runs: number
  total_credits_used: number
  pending_suggestions: number
  runs_today: number
  new_users_week: number
}
