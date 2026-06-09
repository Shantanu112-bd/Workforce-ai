import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import AppLayout from '@/app/layout-app'
import AdminClient from '@/components/admin/AdminClient'
import DbErrorView from '@/components/ui/DbErrorView'

export default async function AdminPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Check admin
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(id => id.trim())
  if (!adminIds.includes(userId)) redirect('/dashboard')

  let agents = []
  let suggestions = []
  let users = []
  let totalRuns = 0
  let totalUsers = 0
  let pendingSuggestions = 0
  let totalCreditsUsed = 0
  let dbErrorMsg: string | null = null

  try {
    const [
      agentsRes,
      suggestionsRes,
      usersRes,
      totalRunsRes,
      totalUsersRes,
      pendingSuggestionsRes,
    ] = await Promise.all([
      supabaseAdmin.from('agents').select('*').order('run_count', { ascending: false }),
      supabaseAdmin.from('suggestions').select('*, user:users(full_name, email)').order('created_at', { ascending: false }).limit(20),
      supabaseAdmin.from('users').select('*, credit_wallets(total_credits, used_credits)').order('created_at', { ascending: false }).limit(50),
      supabaseAdmin.from('workflows').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('suggestions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

    if (agentsRes.error) dbErrorMsg = agentsRes.error.message
    else if (suggestionsRes.error) dbErrorMsg = suggestionsRes.error.message
    else if (usersRes.error) dbErrorMsg = usersRes.error.message
    else if (totalRunsRes.error) dbErrorMsg = totalRunsRes.error.message
    else if (totalUsersRes.error) dbErrorMsg = totalUsersRes.error.message
    else if (pendingSuggestionsRes.error) dbErrorMsg = pendingSuggestionsRes.error.message
    else {
      agents = agentsRes.data || []
      suggestions = suggestionsRes.data || []
      users = usersRes.data || []
      totalRuns = totalRunsRes.count || 0
      totalUsers = totalUsersRes.count || 0
      pendingSuggestions = pendingSuggestionsRes.count || 0
    }

    if (!dbErrorMsg) {
      const { data: creditData, error: creditError } = await supabaseAdmin.from('credit_ledger').select('amount').eq('type', 'debit')
      if (creditError) {
        dbErrorMsg = creditError.message
      } else {
        totalCreditsUsed = creditData?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0
      }
    }
  } catch (err: any) {
    dbErrorMsg = err?.message || 'Failed to query admin details'
  }

  if (dbErrorMsg) {
    return <DbErrorView error={dbErrorMsg} />
  }

  return (
    <AppLayout>
      <AdminClient
        agents={agents}
        suggestions={suggestions}
        users={users}
        stats={{
          total_users: totalUsers,
          total_runs: totalRuns,
          total_credits_used: totalCreditsUsed,
          pending_suggestions: pendingSuggestions,
          runs_today: 0,
          new_users_week: 0,
        }}
      />
    </AppLayout>
  )
}

