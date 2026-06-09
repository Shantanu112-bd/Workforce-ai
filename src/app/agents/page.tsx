import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import AppLayout from '@/app/layout-app'
import AgentsClient from '@/components/agents/AgentsClient'
import DbErrorView from '@/components/ui/DbErrorView'

export const metadata = {
  title: 'All Agents — WorkForce AI',
  description: 'Browse all available AI agents by category',
}

export default async function AgentsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  let agents = []
  let user = null
  let wallet = null
  let dbErrorMsg: string | null = null

  try {
    const { data: agentsData, error: agentsError } = await supabaseAdmin
      .from('agents')
      .select('*')
      .order('run_count', { ascending: false })

    if (agentsError) {
      dbErrorMsg = agentsError.message
    } else {
      agents = agentsData || []
    }

    if (!dbErrorMsg) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, plan')
        .eq('clerk_id', userId)
        .single()

      if (userError) {
        if (userError.code === 'PGRST116') {
          user = null
        } else {
          dbErrorMsg = userError.message
        }
      } else {
        user = userData
      }
    }

    if (!dbErrorMsg && user) {
      const { data: walletData, error: walletError } = await supabaseAdmin
        .from('credit_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (walletError) {
        dbErrorMsg = walletError.message
      } else {
        wallet = walletData
      }
    }
  } catch (err: any) {
    dbErrorMsg = err?.message || 'Failed to communicate with database.'
  }

  if (dbErrorMsg) {
    return <DbErrorView error={dbErrorMsg} />
  }

  if (!user) {
    redirect('/dashboard')
  }

  const remaining = wallet ? wallet.total_credits - wallet.used_credits : 0

  return (
    <AppLayout>
      <AgentsClient
        agents={agents}
        remainingCredits={remaining}
        userPlan={user.plan}
      />
    </AppLayout>
  )
}

