import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

const UserUpdateSchema = z.object({
  plan: z.enum(['free', 'pro', 'enterprise']).optional(),
  is_admin: z.boolean().optional(),
  add_credits: z.number().int().min(1).max(10000).optional(),
})

// PATCH /api/admin/users?id=[userId]
export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((s) => s.trim())
  if (!adminIds.includes(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const targetUserId = searchParams.get('id')
  if (!targetUserId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

  let body: z.infer<typeof UserUpdateSchema>
  try {
    body = UserUpdateSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (body.plan) updates.plan = body.plan
  if (body.is_admin !== undefined) updates.is_admin = body.is_admin
  updates.updated_at = new Date().toISOString()

  if (Object.keys(updates).length > 1) {
    const { error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', targetUserId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Handle credit top-up separately
  if (body.add_credits) {
    const { data: wallet } = await supabaseAdmin
      .from('credit_wallets')
      .select('*')
      .eq('user_id', targetUserId)
      .single()

    if (wallet) {
      const newTotal = wallet.total_credits + body.add_credits
      await supabaseAdmin
        .from('credit_wallets')
        .update({ total_credits: newTotal })
        .eq('user_id', targetUserId)

      await supabaseAdmin.from('credit_ledger').insert({
        user_id: targetUserId,
        amount: body.add_credits,
        type: 'bonus',
        description: 'Admin credit grant',
        balance_after: newTotal - wallet.used_credits,
      })
    }
  }

  return NextResponse.json({ success: true })
}
