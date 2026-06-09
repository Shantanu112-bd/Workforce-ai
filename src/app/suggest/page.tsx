import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import AppLayout from '@/app/layout-app'
import SuggestClient from '@/components/suggest/SuggestClient'
import DbErrorView from '@/components/ui/DbErrorView'

export const metadata = {
  title: 'Suggest an Agent — WorkForce AI',
  description: 'Request new AI workflows to be built by the WorkForce AI team',
}

export default async function SuggestPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  let user = null
  let pastSuggestions = []
  let dbErrorMsg: string | null = null

  try {
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email')
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
      // Get user's own past suggestions
      const { data: pastData, error: suggestionsError } = await supabaseAdmin
        .from('suggestions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (suggestionsError) {
        dbErrorMsg = suggestionsError.message
      } else {
        pastSuggestions = pastData || []
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
      <SuggestClient userId={user.id} pastSuggestions={pastSuggestions} />
    </AppLayout>
  )
}

