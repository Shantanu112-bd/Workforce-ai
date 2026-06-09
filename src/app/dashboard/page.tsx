import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import AppLayout from '@/app/layout-app'
import DashboardClient from '@/components/dashboard/DashboardClient'
import DbErrorView from '@/components/ui/DbErrorView'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  let user = null
  let dbErrorMsg: string | null = null

  // Fetch user data server-side
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        user = null
      } else {
        dbErrorMsg = error.message
      }
    } else {
      user = data
    }
  } catch (err: any) {
    dbErrorMsg = err?.message || 'Failed to connect to the database.'
  }

  if (dbErrorMsg) {
    return <DbErrorView error={dbErrorMsg} />
  }

  // Auto-create user if first visit (fallback for local development without webhooks)
  if (!user) {
    const clerkUser = await currentUser()
    if (clerkUser) {
      const email = clerkUser.emailAddresses[0]?.emailAddress || ''
      const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'New User'
      const avatarUrl = clerkUser.imageUrl || null

      try {
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
          return <DbErrorView error={`Failed to auto-provision profile in database: ${insertError.message}`} />
        } else {
          user = newUser
        }
      } catch (err: any) {
        return <DbErrorView error={`Failed to auto-provision profile: ${err?.message || err}`} />
      }
    } else {
      redirect('/sign-in')
    }
  }

  let wallet = null
  let agents = []
  let recentWorkflows = []
  let runsThisWeek = 0

  try {
    const { data: walletData, error: walletError } = await supabaseAdmin
      .from('credit_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (walletError) {
      return <DbErrorView error={`Failed to retrieve credit wallet: ${walletError.message}`} />
    }
    wallet = walletData

    const { data: agentsData, error: agentsError } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('is_enabled', true)
      .order('run_count', { ascending: false })

    if (agentsError) {
      return <DbErrorView error={`Failed to retrieve agents list: ${agentsError.message}`} />
    }
    agents = agentsData || []

    const { data: recentData, error: recentError } = await supabaseAdmin
      .from('workflows')
      .select('*, agent:agents(title, icon, category)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) {
      return <DbErrorView error={`Failed to retrieve recent workflows: ${recentError.message}`} />
    }
    recentWorkflows = recentData || []

    const { count, error: countError } = await supabaseAdmin
      .from('workflows')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (countError) {
      return <DbErrorView error={`Failed to retrieve weekly runs stats: ${countError.message}`} />
    }
    runsThisWeek = count || 0
  } catch (err: any) {
    return <DbErrorView error={`Database error during load: ${err?.message || err}`} />
  }

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

