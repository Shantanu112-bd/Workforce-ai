import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import AppLayout from '@/app/layout-app'
import SuggestClient from '@/components/suggest/SuggestClient'

export const metadata = {
  title: 'Suggest an Agent — WorkForce AI',
  description: 'Request new AI workflows to be built by the WorkForce AI team',
}

export default async function SuggestPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email')
    .eq('clerk_id', userId)
    .single()

  if (!user) redirect('/dashboard')

  // Get user's own past suggestions
  const { data: pastSuggestions } = await supabaseAdmin
    .from('suggestions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <AppLayout>
      <SuggestClient userId={user.id} pastSuggestions={pastSuggestions || []} />
    </AppLayout>
  )
}
