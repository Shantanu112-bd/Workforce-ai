'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard, Bot, History, Plug2, Lightbulb,
  Shield, Zap, TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCreditWallet } from '@/hooks/useCredits'

interface NavItem {
  label: string
  href: string
  icon: any
  section: 'main' | 'tools' | 'admin'
  badge?: string | null
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'main' },
  { label: 'All Agents', href: '/agents', icon: Bot, section: 'main' },
  { label: 'History', href: '/history', icon: History, badge: null, section: 'main' },
  { label: 'Connections', href: '/connections', icon: Plug2, section: 'tools' },
  { label: 'Suggest Agent', href: '/suggest', icon: Lightbulb, section: 'tools' },
  { label: 'Admin Panel', href: '/admin', icon: Shield, section: 'admin' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { wallet, loading } = useCreditWallet()

  const remaining = wallet ? wallet.total_credits - wallet.used_credits : 0
  const fillPct = wallet ? ((remaining / wallet.total_credits) * 100).toFixed(0) : 0

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Sidebar */}
      <aside className="w-56 min-w-56 flex flex-col bg-bg-2 border-r border-border">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-base">⚡</div>
            <div>
              <div className="font-heading font-bold text-sm leading-none">WorkForce AI</div>
              <div className="text-text-3 text-[10px] uppercase tracking-wider mt-0.5">Curated agents</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {['main', 'tools', 'admin'].map((section) => {
            const items = NAV_ITEMS.filter(i => i.section === section)
            return (
              <div key={section} className="mb-1">
                <div className="px-4 py-2 text-[10px] text-text-3 uppercase tracking-widest font-medium">
                  {section === 'main' ? 'Main' : section === 'tools' ? 'Tools' : 'Admin'}
                </div>
                {items.map((item) => {
                  const Icon = item.icon
                  const active = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 px-4 py-2.5 text-sm transition-all duration-150 border-l-2 mx-0',
                        active
                          ? 'bg-bg-3 text-text border-l-accent'
                          : 'text-text-2 hover:bg-bg-3 hover:text-text border-l-transparent'
                      )}
                    >
                      <Icon size={16} strokeWidth={1.8} />
                      {item.label}
                      {item.badge && (
                        <span className="ml-auto bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* Credits card */}
        <div className="mx-3 mb-2 bg-bg-3 border border-border rounded-xl p-3.5">
          <div className="text-[10px] text-text-3 uppercase tracking-wider mb-1.5">Credits remaining</div>
          {loading ? (
            <div className="skeleton h-6 w-16 mb-1" />
          ) : (
            <>
              <div className="font-heading font-bold text-xl text-accent-2">{remaining}</div>
              <div className="text-text-3 text-[11px] mt-0.5">
                of {wallet?.total_credits ?? 50} {wallet ? '' : 'free'} plan
              </div>
              <div className="h-1 bg-bg-4 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent to-accent-2 rounded-full transition-all"
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            </>
          )}
        </div>

        <Link href="/upgrade" className="mx-3 mb-3 flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-purple-600 text-white text-xs font-semibold py-2 rounded-lg transition-opacity hover:opacity-90">
          <Zap size={13} />
          Upgrade to Pro
        </Link>

        {/* User */}
        <div className="px-4 py-3 border-t border-border flex items-center gap-2">
          <UserButton afterSignOutUrl="/" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">My Account</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
