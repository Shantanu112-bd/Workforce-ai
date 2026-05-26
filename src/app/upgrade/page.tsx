import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import UpgradeClient from '@/components/upgrade/UpgradeClient'

export const metadata = {
  title: 'Upgrade — WorkForce AI',
  description: 'Upgrade your plan to unlock more credits and advanced AI agents',
}

export default async function UpgradePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return <UpgradeClient />
}
