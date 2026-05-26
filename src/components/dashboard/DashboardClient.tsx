'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RefreshCw, Eye, Download, X, Search } from 'lucide-react'
import { DBUser, DBCreditWallet, DBAgent, DBWorkflow, DashboardStats, AgentCategory } from '@/types'
import { CATEGORY_LABELS, DIFFICULTY_COLORS, DIFFICULTY_LABELS, STATUS_COLORS, STATUS_LABELS, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Props {
  user: DBUser
  wallet: DBCreditWallet | null
  agents: DBAgent[]
  recentWorkflows: (DBWorkflow & { agent: { title: string; icon: string; category: string } | null })[]
  stats: DashboardStats
}

const CATEGORY_FILTERS: { label: string; value: 'all' | AgentCategory }[] = [
  { label: 'All', value: 'all' },
  { label: '👨‍💻 Developer', value: 'developer' },
  { label: '📚 Teacher', value: 'teacher' },
  { label: '💼 Business', value: 'business' },
  { label: '🎨 Creator', value: 'creator' },
]

export default function DashboardClient({ user, wallet, agents, recentWorkflows, stats }: Props) {
  const [activeCategory, setActiveCategory] = useState<'all' | AgentCategory>('all')
  const [search, setSearch] = useState('')

  const firstName = user.full_name?.split(' ')[0] || 'there'
  const remaining = wallet ? wallet.total_credits - wallet.used_credits : 0

  const filteredAgents = agents.filter(a => {
    const matchesCat = activeCategory === 'all' || a.category === activeCategory
    const matchesSearch = search === '' ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <div>
      {/* Topbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-bg-2/80 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3">
          <h1 className="font-heading font-bold text-base">Dashboard</h1>
          <div className="flex items-center gap-2 bg-bg-3 border border-border rounded-lg px-3 py-1.5 text-xs text-text-2 min-w-[180px]">
            <Search size={13} className="text-text-3" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent outline-none flex-1 placeholder:text-text-3"
              placeholder="Search agents..."
            />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-7">
        {/* Welcome banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1A1A2E] to-[#16213E] border border-border-2 rounded-2xl p-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative">
            <h2 className="font-heading font-extrabold text-xl mb-1">Good morning, {firstName} 👋</h2>
            <p className="text-text-2 text-sm">What do you want to automate today?</p>
            <div className="flex gap-6 mt-4">
              {[
                { n: stats.runs_this_week, l: 'Runs this week' },
                { n: stats.credits_used_total, l: 'Credits used' },
                { n: `${stats.time_saved_hours}h`, l: 'Time saved' },
              ].map(({ n, l }) => (
                <div key={l}>
                  <div className="font-heading font-bold text-lg text-accent-2">{n}</div>
                  <div className="text-text-3 text-xs">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agents section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-sm">Agents by category</h2>
            <Link href="/agents" className="text-xs text-accent hover:underline">View all →</Link>
          </div>

          {/* Category filters */}
          <div className="flex gap-2 flex-wrap mb-5">
            {CATEGORY_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setActiveCategory(f.value)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all',
                  activeCategory === f.value
                    ? 'bg-accent border-accent text-white'
                    : 'border-border text-text-2 hover:text-text hover:border-border-2'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Agent cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAgents.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>

          {filteredAgents.length === 0 && (
            <div className="text-center py-10 text-text-3 text-sm">
              No agents found. <button onClick={() => { setSearch(''); setActiveCategory('all') }} className="text-accent hover:underline">Clear filters</button>
            </div>
          )}
        </div>

        {/* Recent runs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-sm">Recent runs</h2>
            <Link href="/history" className="text-xs text-accent hover:underline">Full history →</Link>
          </div>

          {recentWorkflows.length === 0 ? (
            <div className="card p-6 text-center text-text-3 text-sm">
              No runs yet. Pick an agent above to get started ⚡
            </div>
          ) : (
            <div className="space-y-2">
              {recentWorkflows.map(wf => (
                <WorkflowRunRow key={wf.id} workflow={wf} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AgentCard({ agent }: { agent: DBAgent }) {
  return (
    <div className="group card-hover p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-accent/3 pointer-events-none" />
      <div className="text-2xl mb-3">{agent.icon}</div>
      <h3 className="font-heading font-semibold text-sm mb-1">{agent.title}</h3>
      <p className="text-text-2 text-xs leading-relaxed mb-3 line-clamp-2">{agent.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-text-3 text-xs flex items-center gap-1">
            <span className="text-brand-amber">⬡</span> {agent.credit_cost}
          </span>
          <span className={cn('badge text-[10px]', DIFFICULTY_COLORS[agent.difficulty])}>
            {DIFFICULTY_LABELS[agent.difficulty]}
          </span>
        </div>
      </div>
      <div className="mt-3">
        <Link
          href={`/run/${agent.slug}`}
          className="btn-primary w-full text-center text-xs py-2 block"
        >
          ▶ Run agent
        </Link>
      </div>
    </div>
  )
}

function WorkflowRunRow({ workflow }: {
  workflow: DBWorkflow & { agent: { title: string; icon: string } | null }
}) {
  const dotColors: Record<string, string> = {
    completed: 'bg-accent-2',
    running: 'bg-brand-amber animate-pulse-dot',
    failed: 'bg-brand-red',
    pending: 'bg-text-3',
    cancelled: 'bg-text-3',
  }

  return (
    <div className="card flex items-center gap-3 px-4 py-3 hover:border-border-2 transition-colors">
      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', dotColors[workflow.status])} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {workflow.agent?.icon} {workflow.agent?.title}
        </div>
        <div className="text-xs text-text-3 mt-0.5">
          {workflow.status === 'running' ? 'Running now...' : formatDate(workflow.created_at)}
          {workflow.input_tokens && ` · ${(workflow.input_tokens + (workflow.output_tokens || 0)).toLocaleString()} tokens`}
        </div>
      </div>
      {workflow.credits_used && (
        <div className="text-xs text-text-3 flex items-center gap-1">
          <span className="text-brand-amber">⬡</span> {workflow.credits_used}
        </div>
      )}
      <div className="flex gap-1">
        {workflow.status === 'running' ? (
          <button className="p-1.5 rounded-md bg-bg-3 border border-border text-text-2 hover:text-brand-red transition-colors" title="Cancel">
            <X size={13} />
          </button>
        ) : (
          <>
            <Link href={`/run/${workflow.agent?.title?.toLowerCase().replace(/ /g, '-')}?rerun=${workflow.id}`}
              className="p-1.5 rounded-md bg-bg-3 border border-border text-text-2 hover:text-accent transition-colors" title="Re-run">
              <RefreshCw size={13} />
            </Link>
            <Link href={`/history/${workflow.id}`}
              className="p-1.5 rounded-md bg-bg-3 border border-border text-text-2 hover:text-accent transition-colors" title="View output">
              <Eye size={13} />
            </Link>
            <button className="p-1.5 rounded-md bg-bg-3 border border-border text-text-2 hover:text-accent transition-colors" title="Download">
              <Download size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
