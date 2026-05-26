import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import AppLayout from '@/app/layout-app'
import AgentsClient from '@/components/agents/AgentsClient'

export const metadata = {
  title: 'All Agents — WorkForce AI',
  description: 'Browse all available AI agents by category',
}

export default async function AgentsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { data: agents } = await supabaseAdmin
    .from('agents')
    .select('*')
    .order('run_count', { ascending: false })

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, plan')
    .eq('clerk_id', userId)
    .single()

  const { data: wallet } = user
    ? await supabaseAdmin.from('credit_wallets').select('*').eq('user_id', user.id).single()
    : { data: null }

  const remaining = wallet ? wallet.total_credits - wallet.used_credits : 0

  return (
    <AppLayout>
      <AgentsClient
        agents={agents || []}
        remainingCredits={remaining}
        userPlan={user?.plan || 'free'}
      />
    </AppLayout>
  )
}
