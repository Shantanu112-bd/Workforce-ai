import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import AppLayout from '@/app/layout-app'
import HistoryClient from '@/components/history/HistoryClient'

export default async function HistoryPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { data: user } = await supabaseAdmin.from('users').select('id').eq('clerk_id', userId).single()
  if (!user) redirect('/dashboard')

  const { data: workflows } = await supabaseAdmin
    .from('workflows')
    .select('*, agent:agents(title, icon, category, slug)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <AppLayout>
      <HistoryClient workflows={workflows || []} />
    </AppLayout>
  )
}
