'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RefreshCw, Eye, Download } from 'lucide-react'
import { DBWorkflow, WorkflowStatus } from '@/types'
import { cn, formatDate, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'

interface Props {
  workflows: (DBWorkflow & { agent: { title: string; icon: string; category: string; slug: string } | null })[]
}

type Filter = 'all' | WorkflowStatus | 'developer' | 'business' | 'creator' | 'teacher'

export default function HistoryClient({ workflows }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = workflows.filter(wf => {
    if (filter === 'all') return true
    if (['completed', 'failed', 'running', 'pending'].includes(filter)) return wf.status === filter
    return wf.agent?.category === filter
  })

  const FILTERS: { label: string; value: Filter }[] = [
    { label: 'All', value: 'all' },
    { label: '✓ Completed', value: 'completed' },
    { label: '⟳ Running', value: 'running' },
    { label: '✗ Failed', value: 'failed' },
    { label: '👨‍💻 Developer', value: 'developer' },
    { label: '💼 Business', value: 'business' },
    { label: '🎨 Creator', value: 'creator' },
  ]

  return (
    <div>
      <div className="sticky top-0 z-10 px-6 py-4 bg-bg-2/80 backdrop-blur border-b border-border">
        <h1 className="font-heading font-bold text-base">Workflow History</h1>
      </div>

      <div className="p-6">
        <div className="flex gap-2 flex-wrap mb-5">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                filter === f.value ? 'bg-accent border-accent text-white' : 'border-border text-text-2 hover:text-text hover:border-border-2'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="card p-10 text-center text-text-3 text-sm">
            No runs found. <Link href="/dashboard" className="text-accent hover:underline">Run an agent →</Link>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map(wf => (
            <Link key={wf.id} href={`/history/${wf.id}`}
              className="card flex items-center gap-3 px-4 py-3.5 hover:border-border-2 transition-colors block">
              <div className="text-xl">{wf.agent?.icon || '🤖'}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{wf.agent?.title}</div>
                <div className="text-xs text-text-3 mt-0.5">{formatDate(wf.created_at)} · {wf.agent?.category}</div>
              </div>
              <div className={cn('text-xs font-medium', STATUS_COLORS[wf.status])}>
                {STATUS_LABELS[wf.status]}
              </div>
              {wf.credits_used && (
                <div className="text-xs text-text-3 flex items-center gap-1">
                  <span className="text-brand-amber">⬡</span> {wf.credits_used}
                </div>
              )}
              <div className="flex gap-1" onClick={e => e.preventDefault()}>
                {wf.agent && (
                  <Link href={`/run/${wf.agent.slug}`}
                    className="p-1.5 rounded-md bg-bg-3 border border-border text-text-2 hover:text-accent transition-colors">
                    <RefreshCw size={12} />
                  </Link>
                )}
                <button className="p-1.5 rounded-md bg-bg-3 border border-border text-text-2 hover:text-accent transition-colors">
                  <Eye size={12} />
                </button>
                <button className="p-1.5 rounded-md bg-bg-3 border border-border text-text-2 hover:text-accent transition-colors">
                  <Download size={12} />
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
