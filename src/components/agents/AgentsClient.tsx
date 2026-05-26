'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Zap } from 'lucide-react'
import { DBAgent, AgentCategory } from '@/types'
import { cn, CATEGORY_LABELS, CATEGORY_COLORS, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/lib/utils'

interface Props {
  agents: DBAgent[]
  remainingCredits: number
  userPlan: string
}

const CATEGORIES: { label: string; value: 'all' | AgentCategory }[] = [
  { label: 'All agents', value: 'all' },
  { label: '👨‍💻 Developer', value: 'developer' },
  { label: '📚 Teacher', value: 'teacher' },
  { label: '💼 Business', value: 'business' },
  { label: '🎨 Creator', value: 'creator' },
]

export default function AgentsClient({ agents, remainingCredits, userPlan }: Props) {
  const [category, setCategory] = useState<'all' | AgentCategory>('all')
  const [search, setSearch] = useState('')

  const filtered = agents.filter((a) => {
    const matchesCat = category === 'all' || a.category === category
    const matchesSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  const grouped = CATEGORIES.slice(1).map((cat) => ({
    ...cat,
    agents: filtered.filter((a) => a.category === cat.value),
  })).filter((g) => category === 'all' ? g.agents.length > 0 : g.value === category)

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 bg-bg-2/80 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="font-heading font-bold text-base">All Agents</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-bg-3 border border-border rounded-lg px-3 py-1.5 text-xs text-text-2 w-52">
              <Search size={13} className="text-text-3 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none flex-1 placeholder:text-text-3"
                placeholder="Search agents..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-7">
        {/* Credits banner */}
        <div className="flex items-center justify-between bg-bg-3 border border-border rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Zap size={16} className="text-brand-amber" />
            <span className="text-text-2">
              <span className="font-semibold text-text">{remainingCredits}</span> credits remaining on{' '}
              <span className={cn('font-semibold', userPlan === 'pro' ? 'text-brand-amber' : 'text-accent')}>
                {userPlan}
              </span>{' '}
              plan
            </span>
          </div>
          {userPlan === 'free' && (
            <Link href="/upgrade" className="text-xs bg-gradient-to-r from-accent to-purple-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
              Upgrade →
            </Link>
          )}
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all',
                category === c.value
                  ? 'bg-accent border-accent text-white'
                  : 'border-border text-text-2 hover:text-text hover:border-border-2'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* No results */}
        {filtered.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-3xl mb-3">🤷</div>
            <p className="text-text-2 text-sm">No agents match your search.</p>
            <button onClick={() => { setSearch(''); setCategory('all') }} className="text-accent text-xs hover:underline mt-2">
              Clear filters
            </button>
          </div>
        )}

        {/* Grouped agent cards */}
        {grouped.map(({ label, value, agents: groupAgents }) => (
          <div key={value}>
            <h2 className="font-heading font-bold text-sm mb-4">{label}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} remainingCredits={remainingCredits} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AgentCard({ agent, remainingCredits }: { agent: DBAgent; remainingCredits: number }) {
  const canRun = remainingCredits >= agent.credit_cost && agent.is_enabled

  return (
    <div className={cn('group card p-5 relative overflow-hidden flex flex-col transition-all duration-200', agent.is_enabled ? 'hover:border-accent/50 hover:-translate-y-0.5' : 'opacity-60')}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-accent/3 pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between mb-3 relative">
        <div className="text-2xl">{agent.icon}</div>
        <div className="flex items-center gap-1.5">
          <span className={cn('badge text-[10px]', CATEGORY_COLORS[agent.category])}>
            {agent.category}
          </span>
          {!agent.is_enabled && (
            <span className="badge text-[10px] bg-bg-3 text-text-3 border border-border">
              Soon
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        <h3 className="font-heading font-semibold text-sm mb-1.5">{agent.title}</h3>
        <p className="text-text-2 text-xs leading-relaxed line-clamp-2">{agent.description}</p>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-border relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-text-3 text-xs flex items-center gap-1">
              <span className="text-brand-amber">⬡</span>
              <span className="font-semibold text-text">{agent.credit_cost}</span> credits
            </span>
            <span className={cn('badge text-[10px]', DIFFICULTY_COLORS[agent.difficulty])}>
              {DIFFICULTY_LABELS[agent.difficulty]}
            </span>
          </div>
          {agent.run_count > 0 && (
            <span className="text-[10px] text-text-3">{agent.run_count.toLocaleString()} runs</span>
          )}
        </div>

        {agent.is_enabled ? (
          <Link
            href={`/run/${agent.slug}`}
            className={cn(
              'btn-primary w-full text-center text-xs py-2 block',
              !canRun && 'opacity-50 pointer-events-none'
            )}
          >
            {canRun ? '▶ Run agent' : 'Not enough credits'}
          </Link>
        ) : (
          <div className="w-full text-center text-xs py-2 bg-bg-3 border border-border text-text-3 rounded-lg cursor-not-allowed">
            Coming soon
          </div>
        )}
      </div>
    </div>
  )
}
