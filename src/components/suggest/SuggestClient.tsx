'use client'

import { useState } from 'react'
import { Lightbulb, CheckCircle2, Clock, XCircle, Send, ChevronDown } from 'lucide-react'
import { DBSuggestion, AgentCategory, AgentDifficulty, SuggestionStatus } from '@/types'
import { cn, formatDate } from '@/lib/utils'

interface Props {
  userId: string
  pastSuggestions: DBSuggestion[]
}

const CATEGORIES: AgentCategory[] = ['developer', 'teacher', 'business', 'creator']
const DIFFICULTIES: AgentDifficulty[] = ['low', 'medium', 'high']

const STATUS_DISPLAY: Record<SuggestionStatus, { label: string; icon: React.ReactNode; className: string }> = {
  pending: { label: 'Under review', icon: <Clock size={13} />, className: 'text-brand-amber' },
  approved: { label: 'Approved! 🎉', icon: <CheckCircle2 size={13} />, className: 'text-accent-2' },
  rejected: { label: 'Not selected', icon: <XCircle size={13} />, className: 'text-brand-red' },
  archived: { label: 'Archived', icon: <XCircle size={13} />, className: 'text-text-3' },
}

export default function SuggestClient({ userId, pastSuggestions }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<AgentCategory>('developer')
  const [complexity, setComplexity] = useState<AgentDifficulty>('medium')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.')
      return
    }
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category, estimated_complexity: complexity }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit suggestion')
      }

      setSubmitted(true)
      setTitle('')
      setDescription('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 bg-bg-2/80 backdrop-blur border-b border-border">
        <h1 className="font-heading font-bold text-base">Suggest an Agent</h1>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Explainer banner */}
        <div className="bg-gradient-to-br from-accent/8 to-purple-600/8 border border-accent/20 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
              <Lightbulb size={20} className="text-accent" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-sm mb-1">Have an idea?</h2>
              <p className="text-text-2 text-xs leading-relaxed">
                Tell us what AI workflow would save you time. Popular suggestions get built and added to
                the platform. When your suggestion is approved, you&apos;ll get <strong className="text-accent-2">50 bonus credits</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        {submitted ? (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="font-heading font-bold text-lg mb-1">Suggestion submitted!</h3>
            <p className="text-text-2 text-sm">
              Our team will review it and get back to you. You&apos;ll be notified if it&apos;s approved.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="btn-secondary mt-5 text-sm"
            >
              Submit another idea
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 space-y-5">
            <div>
              <label className="block text-xs text-text-2 font-medium mb-1.5">
                Agent name / title <span className="text-brand-red">*</span>
              </label>
              <input
                className="input"
                placeholder="e.g. Job Application Cover Letter Generator"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />
            </div>

            <div>
              <label className="block text-xs text-text-2 font-medium mb-1.5">
                What would it do? <span className="text-brand-red">*</span>
              </label>
              <textarea
                className="input min-h-[100px] resize-y"
                placeholder="Describe the workflow in detail. What inputs would users provide? What should the output look like? Why would this be useful?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
              />
              <p className="text-text-3 text-xs mt-1">{description.length}/1000</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-2 font-medium mb-1.5">Category</label>
                <select
                  className="input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AgentCategory)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-text-2 font-medium mb-1.5">Complexity estimate</label>
                <select
                  className="input"
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value as AgentDifficulty)}
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-brand-red text-xs">{error}</p>}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Send size={15} />
                {submitting ? 'Submitting...' : 'Submit suggestion'}
              </button>
            </div>
          </form>
        )}

        {/* Past suggestions */}
        {pastSuggestions.length > 0 && (
          <div>
            <h2 className="font-heading font-bold text-sm mb-4">Your past suggestions</h2>
            <div className="space-y-2.5">
              {pastSuggestions.map((s) => {
                const display = STATUS_DISPLAY[s.status]
                return (
                  <div key={s.id} className="card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="font-medium text-sm">{s.title}</div>
                        <div className="text-text-3 text-xs mt-0.5">
                          {s.category} · {formatDate(s.created_at)}
                        </div>
                        <p className="text-text-2 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                          {s.description}
                        </p>
                        {s.admin_notes && (
                          <div className="mt-2 bg-bg-3 border border-border rounded-lg px-3 py-2 text-xs text-text-2">
                            <span className="text-text-3">Admin notes: </span>{s.admin_notes}
                          </div>
                        )}
                      </div>
                      <div className={cn('flex items-center gap-1.5 text-xs font-medium shrink-0', display.className)}>
                        {display.icon}
                        {display.label}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
