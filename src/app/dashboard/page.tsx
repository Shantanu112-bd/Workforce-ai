import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import AppLayout from '@/app/layout-app'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Fetch user data server-side
  let { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('clerk_id', userId)
    .single()

  // Auto-create user if first visit (fallback for local development without webhooks)
  if (!user) {
    const clerkUser = await currentUser()
    if (clerkUser) {
      const email = clerkUser.emailAddresses[0]?.emailAddress || ''
      const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'New User'
      const avatarUrl = clerkUser.imageUrl || null

      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          clerk_id: userId,
          email,
          full_name: fullName,
          avatar_url: avatarUrl,
          plan: 'free',
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error auto-provisioning user:', insertError.message)
        redirect('/sign-in')
      } else {
        user = newUser
      }
    } else {
      redirect('/sign-in')
    }
  }

  const { data: wallet } = await supabaseAdmin
    .from('credit_wallets')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: agents } = await supabaseAdmin
    .from('agents')
    .select('*')
    .eq('is_enabled', true)
    .order('run_count', { ascending: false })

  const { data: recentWorkflows } = await supabaseAdmin
    .from('workflows')
    .select('*, agent:agents(title, icon, category)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Stats
  const { count: runsThisWeek } = await supabaseAdmin
    .from('workflows')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  return (
    <AppLayout>
      <DashboardClient
        user={user}
        wallet={wallet}
        agents={agents || []}
        recentWorkflows={recentWorkflows || []}
        stats={{
          runs_this_week: runsThisWeek || 0,
          credits_used_total: wallet?.used_credits || 0,
          time_saved_hours: Math.floor((wallet?.used_credits || 0) * 0.25),
          remaining_credits: wallet ? wallet.total_credits - wallet.used_credits : 0,
          total_credits: wallet?.total_credits || 50,
        }}
      />
    </AppLayout>
  )
}
