import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import AppLayout from '@/app/layout-app'
import WorkflowRunner from '@/components/workflow/WorkflowRunner'
import DbErrorView from '@/components/ui/DbErrorView'

export default async function RunPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  let agent = null
  let user = null
  let wallet = null
  let dbErrorMsg: string | null = null

  try {
    const { data: agentData, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('slug', slug)
      .eq('is_enabled', true)
      .single()

    if (agentError) {
      if (agentError.code === 'PGRST116') {
        notFound()
      } else {
        dbErrorMsg = agentError.message
      }
    } else {
      agent = agentData
    }

    if (!dbErrorMsg && agent) {
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

  if (!agent) notFound()

  if (!user) {
    redirect('/dashboard')
  }

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

