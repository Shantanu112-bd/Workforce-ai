'use client'

import { useState } from 'react'
import { Users, Play, Coins, Lightbulb, TrendingUp } from 'lucide-react'
import { DBAgent, DBSuggestion, DBUser, AdminStats } from '@/types'
import { cn, formatDate, formatNumber } from '@/lib/utils'

interface Props {
  agents: DBAgent[]
  suggestions: (DBSuggestion & { user: { full_name: string | null; email: string } | null })[]
  users: (DBUser & { credit_wallets: { total_credits: number; used_credits: number }[] | null })[]
  stats: AdminStats
}

type Tab = 'agents' | 'suggestions' | 'users'

export default function AdminClient({ agents, suggestions, users, stats }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('agents')

  const STAT_CARDS = [
    { icon: Users, label: 'Total users', value: formatNumber(stats.total_users), change: `+${stats.new_users_week} this week`, color: 'purple' },
    { icon: Play, label: 'Total runs', value: formatNumber(stats.total_runs), change: `+${stats.runs_today} today`, color: 'green' },
    { icon: Coins, label: 'Credits used', value: formatNumber(stats.total_credits_used), change: 'All time', color: 'amber' },
    { icon: Lightbulb, label: 'Suggestions', value: String(stats.pending_suggestions), change: 'Pending review', color: 'pink' },
  ]

  const iconColors: Record<string, string> = {
    purple: 'bg-accent/15 text-accent',
    green: 'bg-accent-2/12 text-accent-2',
    amber: 'bg-brand-amber/12 text-brand-amber',
    pink: 'bg-accent-3/12 text-accent-3',
  }

  return (
    <div>
      <div className="sticky top-0 z-10 px-6 py-4 bg-bg-2/80 backdrop-blur border-b border-border">
        <h1 className="font-heading font-bold text-base">Admin Panel</h1>
      </div>

      <div className="p-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
          {STAT_CARDS.map(({ icon: Icon, label, value, change, color }) => (
            <div key={label} className="card p-4">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', iconColors[color])}>
                <Icon size={18} strokeWidth={1.8} />
              </div>
              <div className="font-heading font-extrabold text-2xl">{value}</div>
              <div className="text-text-3 text-xs mt-0.5">{label}</div>
              <div className="text-accent-2 text-xs mt-1.5">{change}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border mb-6">
          {(['agents', 'suggestions', 'users'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-5 py-2.5 text-sm font-medium capitalize border-b-2 transition-all',
                activeTab === tab
                  ? 'text-text border-b-accent'
                  : 'text-text-2 border-b-transparent hover:text-text'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Agents tab */}
        {activeTab === 'agents' && (
          <div>
            <div className="flex justify-end mb-3">
              <button className="btn-primary text-xs">+ New agent</button>
            </div>
            <div className="card overflow-hidden">
              <div className="grid px-4 py-2.5 bg-bg-3 text-[10px] text-text-3 uppercase tracking-wider font-semibold" style={{ gridTemplateColumns: '2fr 1fr 70px 70px 90px' }}>
                <span>Agent</span><span>Category</span><span>Credits</span><span>Runs</span><span>Status</span>
              </div>
              {agents.map(agent => (
                <div key={agent.id} className="grid px-4 py-3.5 border-t border-border items-center hover:bg-bg-3/50 transition-colors" style={{ gridTemplateColumns: '2fr 1fr 70px 70px 90px' }}>
                  <div>
                    <div className="text-sm font-medium">{agent.icon} {agent.title}</div>
                    <div className="text-xs text-text-3 mt-0.5 truncate max-w-xs">{agent.description}</div>
                  </div>
                  <span className="text-xs text-text-2 capitalize">{agent.category}</span>
                  <span className="text-sm">{agent.credit_cost}</span>
                  <span className="text-sm text-text-2">{formatNumber(agent.run_count)}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn('badge', agent.is_enabled ? 'badge-active' : 'badge-disabled')}>
                      {agent.is_enabled ? 'Active' : 'Disabled'}
                    </span>
                    <button className="text-xs border border-border text-text-2 hover:border-accent hover:text-accent px-2 py-1 rounded-md transition-colors">Edit</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-3">
            {suggestions.map(s => (
              <SuggestionCard key={s.id} suggestion={s} />
            ))}
            {suggestions.length === 0 && (
              <div className="card p-8 text-center text-text-3 text-sm">No suggestions yet.</div>
            )}
          </div>
        )}

        {/* Users tab */}
        {activeTab === 'users' && (
          <div className="card overflow-hidden">
            <div className="grid px-4 py-2.5 bg-bg-3 text-[10px] text-text-3 uppercase tracking-wider font-semibold" style={{ gridTemplateColumns: '2fr 80px 90px 80px 100px' }}>
              <span>User</span><span>Plan</span><span>Credits left</span><span>Joined</span><span></span>
            </div>
            {users.map(user => {
              const wallet = user.credit_wallets?.[0]
              const remaining = wallet ? wallet.total_credits - wallet.used_credits : 0
              return (
                <div key={user.id} className="grid px-4 py-3 border-t border-border items-center hover:bg-bg-3/50 transition-colors" style={{ gridTemplateColumns: '2fr 80px 90px 80px 100px' }}>
                  <div>
                    <div className="text-sm font-medium">{user.full_name || 'Anonymous'}</div>
                    <div className="text-xs text-text-3">{user.email}</div>
                  </div>
                  <span className={cn('badge', user.plan === 'pro' ? 'badge-pro' : 'badge-free')}>{user.plan}</span>
                  <span className="text-sm text-text-2">{remaining} / {wallet?.total_credits || 50}</span>
                  <span className="text-xs text-text-3">{formatDate(user.created_at)}</span>
                  <div className="flex gap-1.5">
                    <button className="text-xs border border-border text-text-2 hover:border-accent hover:text-accent px-2 py-1 rounded-md transition-colors">Manage</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function SuggestionCard({ suggestion }: {
  suggestion: DBSuggestion & { user: { full_name: string | null; email: string } | null }
}) {
  const [status, setStatus] = useState(suggestion.status)

  const handleApprove = async () => {
    await fetch(`/api/admin/suggestions/${suggestion.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'approved' }), headers: { 'Content-Type': 'application/json' } })
    setStatus('approved')
  }

  const handleReject = async () => {
    await fetch(`/api/admin/suggestions/${suggestion.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'rejected' }), headers: { 'Content-Type': 'application/json' } })
    setStatus('rejected')
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-sm">{suggestion.title}</h3>
          <p className="text-text-3 text-xs mt-0.5">
            by {suggestion.user?.full_name || suggestion.user?.email || 'Unknown'} · {suggestion.category} · {formatDate(suggestion.created_at)}
          </p>
        </div>
        <span className={cn('badge', `badge-${status}`)}>{status}</span>
      </div>
      <p className="text-text-2 text-xs leading-relaxed">{suggestion.description}</p>
      {status === 'pending' && (
        <div className="flex gap-2 mt-3">
          <button onClick={handleApprove} className="text-xs bg-accent-2/10 border border-accent-2/30 text-accent-2 px-3 py-1.5 rounded-lg font-semibold hover:bg-accent-2/20 transition-colors">✓ Approve</button>
          <button onClick={handleReject} className="text-xs bg-brand-red/10 border border-brand-red/30 text-brand-red px-3 py-1.5 rounded-lg font-semibold hover:bg-brand-red/20 transition-colors">✗ Reject</button>
        </div>
      )}
    </div>
  )
}
