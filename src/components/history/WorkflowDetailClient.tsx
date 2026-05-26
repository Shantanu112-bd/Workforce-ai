'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowLeft, Copy, Download, RefreshCw, CheckCircle2,
  XCircle, Clock, Coins, Cpu, Calendar
} from 'lucide-react'
import { DBWorkflow, DBAgent, WorkflowStatus } from '@/types'
import { cn, formatDate, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'

type WorkflowWithAgent = DBWorkflow & {
  agent: Pick<DBAgent, 'id' | 'title' | 'icon' | 'category' | 'slug' | 'credit_cost' | 'description'> | null
}

interface Props {
  workflow: WorkflowWithAgent
}

const STATUS_ICONS: Record<WorkflowStatus, React.ReactNode> = {
  completed: <CheckCircle2 size={16} className="text-accent-2" />,
  failed: <XCircle size={16} className="text-brand-red" />,
  running: <Clock size={16} className="text-brand-amber" />,
  pending: <Clock size={16} className="text-text-3" />,
  cancelled: <XCircle size={16} className="text-text-3" />,
}

export default function WorkflowDetailClient({ workflow }: Props) {
  const [copied, setCopied] = useState(false)

  const output = workflow.output_data as Record<string, unknown> | null
  const input = workflow.input_data as Record<string, unknown>

  const outputText = output ? JSON.stringify(output, null, 2) : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!output) return
    const blob = new Blob([outputText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workflow.agent?.slug || 'workflow'}-${workflow.id.slice(0, 8)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 bg-bg-2/80 backdrop-blur border-b border-border flex items-center gap-3">
        <Link
          href="/history"
          className="flex items-center gap-1.5 text-text-2 hover:text-text text-sm transition-colors"
        >
          <ArrowLeft size={15} /> History
        </Link>
        <span className="text-border">|</span>
        <span className="text-sm text-text-3">{workflow.agent?.title || 'Workflow'}</span>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-5">
        {/* Summary card */}
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="text-3xl">{workflow.agent?.icon || '🤖'}</div>
              <div>
                <h1 className="font-heading font-bold text-lg">{workflow.agent?.title}</h1>
                <p className="text-text-3 text-xs mt-0.5">{workflow.agent?.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {STATUS_ICONS[workflow.status]}
              <span className={cn('text-sm font-medium', STATUS_COLORS[workflow.status])}>
                {STATUS_LABELS[workflow.status]}
              </span>
            </div>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-border">
            {[
              {
                icon: <Calendar size={13} />,
                label: 'Run at',
                value: formatDate(workflow.created_at),
              },
              {
                icon: <Coins size={13} className="text-brand-amber" />,
                label: 'Credits used',
                value: workflow.credits_used?.toString() ?? '—',
              },
              {
                icon: <Cpu size={13} />,
                label: 'Input tokens',
                value: workflow.input_tokens?.toLocaleString() ?? '—',
              },
              {
                icon: <Cpu size={13} />,
                label: 'Output tokens',
                value: workflow.output_tokens?.toLocaleString() ?? '—',
              },
            ].map(({ icon, label, value }) => (
              <div key={label}>
                <div className="flex items-center gap-1 text-[10px] text-text-3 uppercase tracking-wider mb-1">
                  {icon} {label}
                </div>
                <div className="font-heading font-semibold text-sm">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Error state */}
        {workflow.status === 'failed' && workflow.error_message ? (
          <div className="bg-brand-red/8 border border-brand-red/20 rounded-xl p-4">
            <div className="text-sm font-medium text-brand-red mb-1">Error</div>
            <p className="text-text-2 text-xs font-mono">{workflow.error_message}</p>
          </div>
        ) : null}

        {/* Output section */}
        {output ? (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-sm">Output</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
                >
                  <Copy size={12} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
                >
                  <Download size={12} /> Download
                </button>
                {workflow.agent?.slug ? (
                  <Link
                    href={`/run/${workflow.agent.slug}`}
                    className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
                  >
                    <RefreshCw size={12} /> Re-run
                  </Link>
                ) : null}
              </div>
            </div>

            <RenderOutput agentSlug={workflow.agent?.slug || ''} output={output} />
          </div>
        ) : null}

        {/* Input section */}
        <div className="card p-5">
          <h2 className="font-heading font-semibold text-sm mb-4">Input provided</h2>
          <div className="space-y-3">
            {Object.entries(input).map(([key, value]) => (
              <div key={key}>
                <div className="text-[10px] text-text-3 uppercase tracking-wider mb-1">
                  {key.replace(/_/g, ' ')}
                </div>
                <div className="bg-bg-3 rounded-lg px-3 py-2 text-xs text-text-2 break-words">
                  {typeof value === 'boolean'
                    ? value ? 'Yes' : 'No'
                    : String(value).slice(0, 500)
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function RenderOutput({ agentSlug, output }: { agentSlug: string; output: Record<string, unknown> }) {
  if (agentSlug === 'linkedin-tech-post' && !!output.post_body) {
    return (
      <div className="space-y-3">
        <div className="bg-bg-3 rounded-xl p-4 text-sm text-text leading-relaxed border-l-2 border-accent whitespace-pre-wrap">
          {String(output.post_body)}
        </div>
        {Array.isArray(output.hashtags) ? (
          <div className="flex flex-wrap gap-1.5">
            {output.hashtags.map((h: unknown) => (
              <span key={String(h)} className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full font-medium">
                {String(h)}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  if (agentSlug === 'resume-ats-optimizer') {
    return (
      <div className="space-y-4">
        {output.score !== undefined ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-2">ATS Score:</span>
            <span className={cn('font-heading font-extrabold text-3xl', Number(output.score) >= 70 ? 'text-accent-2' : 'text-brand-amber')}>
              {String(output.score)}<span className="text-text-3 text-lg">/100</span>
            </span>
          </div>
        ) : null}
        {Array.isArray(output.missing_keywords) && output.missing_keywords.length > 0 ? (
          <div>
            <div className="text-xs text-text-3 uppercase tracking-wider mb-2">Missing keywords</div>
            <div className="flex flex-wrap gap-1.5">
              {output.missing_keywords.map((k: unknown) => (
                <span key={String(k)} className="text-xs bg-brand-amber/10 text-brand-amber px-2 py-0.5 rounded-md">{String(k)}</span>
              ))}
            </div>
          </div>
        ) : null}
        {output.rewritten_resume ? (
          <div>
            <div className="text-xs text-text-3 uppercase tracking-wider mb-2">Rewritten resume</div>
            <pre className="bg-bg-3 rounded-xl p-4 text-xs text-text font-mono whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
              {String(output.rewritten_resume)}
            </pre>
          </div>
        ) : null}
        {Array.isArray(output.suggestions) ? (
          <div>
            <div className="text-xs text-text-3 uppercase tracking-wider mb-2">Improvement suggestions</div>
            <ul className="space-y-1.5">
              {output.suggestions.map((s: unknown, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs text-text-2">
                  <span className="text-brand-amber shrink-0">{i + 1}.</span>{String(s)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    )
  }

  if (agentSlug === 'meeting-notes-ai' && !!output.summary) {
    return (
      <div className="space-y-4">
        <div>
          <div className="text-xs text-text-3 uppercase tracking-wider mb-1.5">Summary</div>
          <p className="text-sm text-text leading-relaxed bg-bg-3 rounded-xl p-4">{String(output.summary)}</p>
        </div>
        {Array.isArray(output.action_items) && output.action_items.length > 0 ? (
          <div>
            <div className="text-xs text-text-3 uppercase tracking-wider mb-1.5">Action items</div>
            <ul className="space-y-1.5">
              {output.action_items.map((item: unknown, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-text-2">
                  <span className="text-accent-2 shrink-0">→</span>{String(item)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {Array.isArray(output.decisions) && output.decisions.length > 0 ? (
          <div>
            <div className="text-xs text-text-3 uppercase tracking-wider mb-1.5">Decisions made</div>
            <ul className="space-y-1.5">
              {output.decisions.map((d: unknown, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-text-2">
                  <span className="text-accent shrink-0">◆</span>{String(d)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    )
  }

  if (agentSlug === 'social-media-pack' && Array.isArray(output.posts)) {
    return (
      <div className="space-y-3">
        {output.posts.map((post: unknown, i: number) => {
          const p = post as { platform: string; content: string }
          return (
            <div key={i} className="bg-bg-3 rounded-xl p-4">
              <div className="text-[10px] text-text-3 uppercase tracking-wider mb-2">{p.platform}</div>
              <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{p.content}</p>
            </div>
          )
        })}
      </div>
    )
  }

  if (agentSlug === 'github-portfolio' && !!output.readme_content) {
    return (
      <pre className="bg-bg-3 rounded-xl p-4 text-xs text-text font-mono whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
        {String(output.readme_content)}
      </pre>
    )
  }

  if (agentSlug === 'assignment-verifier') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Quality score', value: output.quality_score, suffix: '/100' },
            { label: 'AI probability', value: output.ai_probability, suffix: '%' },
            { label: 'Similarity', value: output.plagiarism_score, suffix: '%' },
          ].map(({ label, value, suffix }) => (
            <div key={label} className="bg-bg-3 rounded-xl p-3 text-center">
              <div className="text-[10px] text-text-3 uppercase tracking-wider mb-1">{label}</div>
              <div className="font-heading font-bold text-xl">{value !== undefined ? `${value}${suffix}` : '—'}</div>
            </div>
          ))}
        </div>
        {output.feedback ? (
          <div>
            <div className="text-xs text-text-3 uppercase tracking-wider mb-1.5">Feedback</div>
            <p className="text-sm text-text leading-relaxed bg-bg-3 rounded-xl p-4">{String(output.feedback)}</p>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <pre className="bg-bg-3 rounded-xl p-4 text-xs text-text font-mono whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
      {JSON.stringify(output, null, 2)}
    </pre>
  )
}
