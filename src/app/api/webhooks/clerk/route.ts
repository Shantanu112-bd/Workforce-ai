import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { supabaseAdmin } from '@/lib/supabase'

interface ClerkUserEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted'
  data: {
    id: string
    email_addresses: Array<{ email_address: string; id: string }>
    first_name: string | null
    last_name: string | null
    image_url: string | null
    primary_email_address_id: string
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) return NextResponse.json({ error: 'No webhook secret' }, { status: 500 })

  const headerList = await headers()
  const svix_id = headerList.get('svix-id')
  const svix_timestamp = headerList.get('svix-timestamp')
  const svix_signature = headerList.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const body = await req.text()

  let event: ClerkUserEvent
  try {
    const wh = new Webhook(webhookSecret)
    event = wh.verify(body, { 'svix-id': svix_id, 'svix-timestamp': svix_timestamp, 'svix-signature': svix_signature }) as ClerkUserEvent
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const { type, data } = event

  if (type === 'user.created') {
    const primaryEmail = data.email_addresses.find(e => e.id === data.primary_email_address_id)
    const email = primaryEmail?.email_address || data.email_addresses[0]?.email_address

    await supabaseAdmin.from('users').insert({
      clerk_id: data.id,
      email,
      full_name: [data.first_name, data.last_name].filter(Boolean).join(' ') || null,
      avatar_url: data.image_url,
    })
    // Wallet is auto-created by DB trigger
  }

  if (type === 'user.updated') {
    const primaryEmail = data.email_addresses.find(e => e.id === data.primary_email_address_id)
    const email = primaryEmail?.email_address

    await supabaseAdmin.from('users').update({
      email,
      full_name: [data.first_name, data.last_name].filter(Boolean).join(' ') || null,
      avatar_url: data.image_url,
    }).eq('clerk_id', data.id)
  }

  if (type === 'user.deleted') {
    await supabaseAdmin.from('users').delete().eq('clerk_id', data.id)
  }

  return NextResponse.json({ success: true })
}
