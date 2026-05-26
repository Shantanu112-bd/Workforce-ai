import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'
import { CreateSuggestionRequest } from '@/types'

const SuggestionSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(1000),
  category: z.enum(['developer', 'teacher', 'business', 'creator']),
  estimated_complexity: z.enum(['low', 'medium', 'high']).optional(),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: CreateSuggestionRequest
  try {
    body = SuggestionSchema.parse(await req.json())
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Get user
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Rate limit: max 5 suggestions per user
  const { count } = await supabaseAdmin
    .from('suggestions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'pending')

  if ((count || 0) >= 5) {
    return NextResponse.json(
      { error: 'You have too many pending suggestions. Wait for existing ones to be reviewed.' },
      { status: 429 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('suggestions')
    .insert({
      user_id: user.id,
      title: body.title,
      description: body.description,
      category: body.category,
      estimated_complexity: body.estimated_complexity || null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, suggestion: data }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data } = await supabaseAdmin
    .from('suggestions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ suggestions: data || [] })
}
