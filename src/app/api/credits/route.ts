import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: wallet } = await supabaseAdmin
    .from('credit_wallets')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const remaining = wallet ? wallet.total_credits - wallet.used_credits : 0

  return NextResponse.json({
    wallet,
    remaining,
    plan: wallet ? 'free' : 'free',
  })
}
