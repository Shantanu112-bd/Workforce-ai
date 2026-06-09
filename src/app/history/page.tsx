import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import AppLayout from '@/app/layout-app'
import HistoryClient from '@/components/history/HistoryClient'
import DbErrorView from '@/components/ui/DbErrorView'

export default async function HistoryPage() {
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

  let workflows = []
  try {
    const { data, error: workflowsError } = await supabaseAdmin
      .from('workflows')
      .select('*, agent:agents(title, icon, category, slug)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (workflowsError) {
      return <DbErrorView error={`Failed to retrieve workflows history: ${workflowsError.message}`} />
    }
    workflows = data || []
  } catch (err: any) {
    return <DbErrorView error={`Database query error: ${err?.message || err}`} />
  }

  return (
    <AppLayout>
      <HistoryClient workflows={workflows} />
    </AppLayout>
  )
}

