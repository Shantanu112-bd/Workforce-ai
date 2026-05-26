'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { DBCreditWallet } from '@/types'

export function useCreditWallet() {
  const { userId } = useAuth()
  const [wallet, setWallet] = useState<DBCreditWallet | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    async function fetchWallet() {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', userId)
        .single()

      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('credit_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setWallet(data)
      setLoading(false)
    }

    fetchWallet()

    // Real-time subscription
    const channel = supabase
      .channel('credit_wallet')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'credit_wallets' }, (payload) => {
        setWallet(payload.new as DBCreditWallet)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const remaining = wallet ? wallet.total_credits - wallet.used_credits : 0

  return { wallet, loading, remaining }
}
