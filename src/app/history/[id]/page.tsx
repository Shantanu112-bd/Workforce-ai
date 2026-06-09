import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import AppLayout from '@/app/layout-app'
import WorkflowDetailClient from '@/components/history/WorkflowDetailClient'
import DbErrorView from '@/components/ui/DbErrorView'

export default async function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  let user = null
  let dbErrorMsg: string | null = null

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
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
    dbErrorMsg = err?.message || 'Failed to query user profile'
  }

  if (dbErrorMsg) {
    return <DbErrorView error={dbErrorMsg} />
  }

  if (!user) {
    redirect('/dashboard')
  }

  let workflow = null
  try {
    const { data, error: workflowError } = await supabaseAdmin
      .from('workflows')
      .select('*, agent:agents(id, title, icon, category, slug, credit_cost, description)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (workflowError) {
      if (workflowError.code === 'PGRST116') {
        notFound()
      } else {
        return <DbErrorView error={`Failed to retrieve workflow detail: ${workflowError.message}`} />
      }
    }
    workflow = data
  } catch (err: any) {
    return <DbErrorView error={`Database query error: ${err?.message || err}`} />
  }

  if (!workflow) notFound()

  return (
    <AppLayout>
      <WorkflowDetailClient workflow={workflow} />
    </AppLayout>
  )
}

