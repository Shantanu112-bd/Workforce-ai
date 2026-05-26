import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import AppLayout from '@/app/layout-app'
import AdminClient from '@/components/admin/AdminClient'

export default async function AdminPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Check admin
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(id => id.trim())
  if (!adminIds.includes(userId)) redirect('/dashboard')

  const [
    { data: agents },
    { data: suggestions },
    { data: users },
    { count: totalRuns },
    { count: totalUsers },
    { count: pendingSuggestions },
  ] = await Promise.all([
    supabaseAdmin.from('agents').select('*').order('run_count', { ascending: false }),
    supabaseAdmin.from('suggestions').select('*, user:users(full_name, email)').order('created_at', { ascending: false }).limit(20),
    supabaseAdmin.from('users').select('*, credit_wallets(total_credits, used_credits)').order('created_at', { ascending: false }).limit(50),
    supabaseAdmin.from('workflows').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('suggestions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const { data: creditData } = await supabaseAdmin.from('credit_ledger').select('amount').eq('type', 'debit')
  const totalCreditsUsed = creditData?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0

  return (
    <AppLayout>
      <AdminClient
        agents={agents || []}
        suggestions={suggestions || []}
        users={users || []}
        stats={{
          total_users: totalUsers || 0,
          total_runs: totalRuns || 0,
          total_credits_used: totalCreditsUsed,
          pending_suggestions: pendingSuggestions || 0,
          runs_today: 0,
          new_users_week: 0,
        }}
      />
    </AppLayout>
  )
}
