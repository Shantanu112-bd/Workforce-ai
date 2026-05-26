import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import AppLayout from '@/app/layout-app'
import WorkflowRunner from '@/components/workflow/WorkflowRunner'

export default async function RunPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('*')
    .eq('slug', slug)
    .eq('is_enabled', true)
    .single()

  if (!agent) notFound()

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, plan')
    .eq('clerk_id', userId)
    .single()

  if (!user) redirect('/dashboard')

  const { data: wallet } = await supabaseAdmin
    .from('credit_wallets')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const remaining = wallet ? wallet.total_credits - wallet.used_credits : 0
  const canRun = remaining >= agent.credit_cost

  return (
    <AppLayout>
      <WorkflowRunner
        agent={agent}
        userId={user.id}
        remainingCredits={remaining}
        canRun={canRun}
      />
    </AppLayout>
  )
}
