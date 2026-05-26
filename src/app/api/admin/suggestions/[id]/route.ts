import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

const SuggestionSchema = z.object({
  status: z.enum(['approved', 'rejected', 'archived']),
  admin_notes: z.string().max(500).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check admin
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((s) => s.trim())
  if (!adminIds.includes(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: z.infer<typeof SuggestionSchema>
  try {
    body = SuggestionSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('suggestions')
    .update({
      status: body.status,
      admin_notes: body.admin_notes || null,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If approved, grant bonus credits to user
  if (body.status === 'approved' && data) {
    const { data: suggestion } = await supabaseAdmin
      .from('suggestions')
      .select('user_id')
      .eq('id', id)
      .single()

    if (suggestion?.user_id) {
      // Get user wallet
      const { data: wallet } = await supabaseAdmin
        .from('credit_wallets')
        .select('*')
        .eq('user_id', suggestion.user_id)
        .single()

      if (wallet) {
        const newTotal = wallet.total_credits + 50
        await supabaseAdmin
          .from('credit_wallets')
          .update({ total_credits: newTotal })
          .eq('user_id', suggestion.user_id)

        // Log the bonus in ledger
        await supabaseAdmin.from('credit_ledger').insert({
          user_id: suggestion.user_id,
          amount: 50,
          type: 'bonus',
          description: 'Suggestion approved bonus',
          balance_after: newTotal - wallet.used_credits,
        })
      }
    }
  }

  return NextResponse.json({ success: true, suggestion: data })
}
