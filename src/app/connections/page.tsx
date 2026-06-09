import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import AppLayout from '@/app/layout-app'
import ConnectionsClient from '@/components/connections/ConnectionsClient'
import DbErrorView from '@/components/ui/DbErrorView'

export const metadata = {
  title: 'Connections — WorkForce AI',
  description: 'Connect your tools and services to unlock AI workflows',
}

export default async function ConnectionsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  let user = null
  let connections = []
  let dbErrorMsg: string | null = null

  try {
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
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

    if (!dbErrorMsg && user) {
      const { data: connectionsData, error: connectionsError } = await supabaseAdmin
        .from('connections')
        .select('*')
        .eq('user_id', user.id)

      if (connectionsError) {
        dbErrorMsg = connectionsError.message
      } else {
        connections = connectionsData || []
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

  return (
    <AppLayout>
      <ConnectionsClient connections={connections} />
    </AppLayout>
  )
}

