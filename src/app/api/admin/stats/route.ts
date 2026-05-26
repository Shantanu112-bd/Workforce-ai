import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((s) => s.trim())
  if (!adminIds.includes(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalUsers },
    { count: newUsersWeek },
    { count: totalRuns },
    { count: runsToday },
    { count: pendingSuggestions },
    { data: creditData },
    { data: agentStats },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    supabaseAdmin.from('workflows').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabaseAdmin.from('workflows').select('*', { count: 'exact', head: true }).gte('created_at', dayAgo).eq('status', 'completed'),
    supabaseAdmin.from('suggestions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('credit_ledger').select('amount').eq('type', 'debit'),
    supabaseAdmin.from('agents').select('title, icon, run_count').order('run_count', { ascending: false }).limit(5),
  ])

  const totalCreditsUsed = creditData?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0

  return NextResponse.json({
    total_users: totalUsers || 0,
    new_users_week: newUsersWeek || 0,
    total_runs: totalRuns || 0,
    runs_today: runsToday || 0,
    pending_suggestions: pendingSuggestions || 0,
    total_credits_used: totalCreditsUsed,
    top_agents: agentStats || [],
  })
}
