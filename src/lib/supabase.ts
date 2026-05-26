import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Browser client (uses anon key + RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side admin client (bypasses RLS — server use only)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : (null as any)

// Create a server client with user context for RLS
export function createServerClientWithUser(clerkUserId: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'x-clerk-user-id': clerkUserId,
      },
    },
    db: {
      schema: 'public',
    },
  })
}
