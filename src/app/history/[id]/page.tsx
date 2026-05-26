import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import AppLayout from '@/app/layout-app'
import WorkflowDetailClient from '@/components/history/WorkflowDetailClient'

export default async function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (!user) redirect('/dashboard')

  const { data: workflow } = await supabaseAdmin
    .from('workflows')
    .select('*, agent:agents(id, title, icon, category, slug, credit_cost, description)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!workflow) notFound()

  return (
    <AppLayout>
      <WorkflowDetailClient workflow={workflow} />
    </AppLayout>
  )
}
