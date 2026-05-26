import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import AppLayout from '@/app/layout-app'
import ConnectionsClient from '@/components/connections/ConnectionsClient'

export const metadata = {
  title: 'Connections — WorkForce AI',
  description: 'Connect your tools and services to unlock AI workflows',
}

export default async function ConnectionsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (!user) redirect('/dashboard')

  const { data: connections } = await supabaseAdmin
    .from('connections')
    .select('*')
    .eq('user_id', user.id)

  return (
    <AppLayout>
      <ConnectionsClient connections={connections || []} />
    </AppLayout>
  )
}
