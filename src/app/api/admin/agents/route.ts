import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

// GET all agents (admin view)
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((s) => s.trim())
  if (!adminIds.includes(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data } = await supabaseAdmin.from('agents').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ agents: data || [] })
}

// PATCH update an agent (toggle enabled, update credit cost, etc.)
const PatchSchema = z.object({
  is_enabled: z.boolean().optional(),
  credit_cost: z.number().int().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
})

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((s) => s.trim())
  if (!adminIds.includes(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const agentId = searchParams.get('id')
  if (!agentId) return NextResponse.json({ error: 'Agent ID required' }, { status: 400 })

  let body: z.infer<typeof PatchSchema>
  try {
    body = PatchSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('agents')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', agentId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ agent: data })
}
