'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, Zap, Copy, Download, RefreshCw, CheckCircle2, Award, Cpu, ShieldAlert, Check, MessageCircle, Heart, Share, Repeat2, ThumbsUp, MessageSquare, Send, FileCode, Sparkles } from 'lucide-react'
import { DBAgent, WorkflowOutput } from '@/types'
import { AGENT_INPUT_SCHEMAS } from '@/lib/agents'
import { cn } from '@/lib/utils'

interface Props {
  agent: DBAgent
  userId: string
  remainingCredits: number
  canRun: boolean
}

type Step = 1 | 2 | 3

export default function WorkflowRunner({ agent, userId, remainingCredits, canRun }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [isRunning, setIsRunning] = useState(false)
  const [runningStep, setRunningStep] = useState(0)
  const [output, setOutput] = useState<WorkflowOutput | null>(null)
  const [workflowId, setWorkflowId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const schema = AGENT_INPUT_SCHEMAS[agent.slug] || {}

  const LOADING_STEPS = [
    'Validating your input...',
    'Calling AI model...',
    'Processing response...',
    'Deducting credits...',
  ]

  const handleFieldChange = (key: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handlePreview = () => {
    // Basic validation
    const requiredFields = Object.entries(schema).filter(([, f]) => f.required).map(([k]) => k)
    const missing = requiredFields.filter(k => !formData[k])
    if (missing.length) {
      setError(`Please fill in: ${missing.join(', ')}`)
      return
    }
    setError(null)
    setStep(2)
  }

  const handleRun = async () => {
    setIsRunning(true)
    setRunningStep(1)
    setError(null)

    // Animate loading steps
    const stepInterval = setInterval(() => {
      setRunningStep(prev => Math.min(prev + 1, LOADING_STEPS.length))
    }, 800)

    try {
      const res = await fetch('/api/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentSlug: agent.slug, inputData: formData }),
      })

      clearInterval(stepInterval)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Workflow failed')
      }

      const data = await res.json()
      setOutput(data.output)
      setWorkflowId(data.workflowId)
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep(2)
    } finally {
      clearInterval(stepInterval)
      setIsRunning(false)
      setRunningStep(0)
    }
  }

  const handleCopy = () => {
    const text = getOutputText()
    navigator.clipboard.writeText(text)
  }

  const handleDownload = () => {
    const text = getOutputText()
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${agent.slug}-output-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getOutputText = () => {
    if (!output) return ''
    if (output.post_body) return `${output.post_body}\n\n${output.hashtags?.join(' ')}`
    if (output.rewritten_resume) return output.rewritten_resume
    if (output.readme_content) return output.readme_content
    if (output.summary) return `Summary:\n${output.summary}\n\nAction Items:\n${output.action_items?.join('\n')}`
    return JSON.stringify(output, null, 2)
  }

  return (
    <div>
      {/* Topbar */}
      <div className="sticky top-0 z-10 px-6 py-4 bg-bg-2/80 backdrop-blur border-b border-border flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-text-2 hover:text-text text-sm transition-colors">
          <ArrowLeft size={15} /> Back
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-3xl mb-3">{agent.icon}</div>
          <h1 className="font-heading font-extrabold text-2xl mb-1">{agent.title}</h1>
          <p className="text-text-2 text-sm">{agent.description}</p>
        </div>

        {/* Steps bar */}
        <StepsBar currentStep={step} />

        {/* Step 1: Input */}
        {step === 1 && (
          <div className="card p-6 animate-fade-in">
            <div className="space-y-4">
              {Object.entries(schema).map(([key, field]) => (
                <div key={key}>
                  <label className="block text-xs text-text-2 font-medium mb-1.5">
                    {field.label}
                    {field.required && <span className="text-brand-red ml-1">*</span>}
                  </label>

                  {field.type === 'textarea' && (
                    <textarea
                      className="input min-h-[90px] resize-y"
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      value={(formData[key] as string) || ''}
                      onChange={e => handleFieldChange(key, e.target.value)}
                    />
                  )}

                  {(field.type === 'text' || field.type === 'url') && (
                    <input
                      type={field.type === 'url' ? 'url' : 'text'}
                      className="input"
                      placeholder={field.placeholder}
                      value={(formData[key] as string) || ''}
                      onChange={e => handleFieldChange(key, e.target.value)}
                    />
                  )}

                  {field.type === 'select' && (
                    <select
                      className="input"
                      value={(formData[key] as string) || field.default as string || field.options?.[0] || ''}
                      onChange={e => handleFieldChange(key, e.target.value)}
                    >
                      {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  )}

                  {field.type === 'boolean' && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-3">{field.helpText}</span>
                      <button
                        type="button"
                        onClick={() => handleFieldChange(key, !formData[key])}
                        className={cn(
                          'w-10 h-5.5 rounded-full border transition-all relative',
                          formData[key] ? 'bg-accent border-accent' : 'bg-bg-4 border-border'
                        )}
                        style={{ height: '22px' }}
                      >
                        <span className={cn(
                          'absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all',
                          formData[key] ? 'left-[22px]' : 'left-0.5'
                        )} />
                      </button>
                    </div>
                  )}

                  {field.helpText && field.type !== 'boolean' && (
                    <p className="text-text-3 text-xs mt-1">{field.helpText}</p>
                  )}
                </div>
              ))}
            </div>

            {error && <p className="text-brand-red text-xs mt-3">{error}</p>}

            <div className="flex justify-end mt-6">
              <button onClick={handlePreview} className="btn-primary flex items-center gap-2">
                Preview output <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && !isRunning && (
          <div className="space-y-4 animate-fade-in">
            <div className="card p-5">
              <div className="text-[10px] text-text-3 uppercase tracking-widest mb-3">Sample output preview</div>
              <div className="bg-bg-3 rounded-lg p-4 text-sm text-text-2 leading-relaxed">
                <PreviewContent agentSlug={agent.slug} formData={formData} />
              </div>
            </div>

            <div className="flex items-center justify-between bg-accent/8 border border-accent/20 rounded-xl px-4 py-3.5">
              <div className="text-sm text-text-2">
                This run will use <span className="font-semibold text-text">{agent.credit_cost} credits</span>
                <span className="text-text-3"> · {remainingCredits} remaining</span>
              </div>
              <div className="font-heading font-bold text-xl text-accent">{agent.credit_cost}<span className="text-xs text-text-3 ml-1 font-normal">credits</span></div>
            </div>

            {!canRun && (
              <div className="bg-brand-red/10 border border-brand-red/30 rounded-xl p-4 text-sm text-brand-red">
                Not enough credits. <Link href="/upgrade" className="underline font-medium">Upgrade to Pro →</Link>
              </div>
            )}

            {error && <p className="text-brand-red text-xs">{error}</p>}

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
                <ArrowLeft size={14} /> Edit input
              </button>
              <button
                onClick={handleRun}
                disabled={!canRun}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Zap size={15} /> Run agent ({agent.credit_cost} credits)
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isRunning && (
          <div className="card p-8 text-center animate-fade-in">
            <div className="w-11 h-11 border-2 border-border border-t-accent rounded-full animate-spin-slow mx-auto mb-5" />
            <div className="font-heading font-semibold text-base mb-5">Running agent...</div>
            <div className="space-y-2.5 text-left max-w-xs mx-auto">
              {LOADING_STEPS.map((s, i) => (
                <div key={s} className={cn(
                  'flex items-center gap-2.5 text-xs transition-colors',
                  i + 1 < runningStep ? 'text-accent-2' : i + 1 === runningStep ? 'text-text' : 'text-text-3'
                )}>
                  <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center flex-shrink-0 text-[9px]">
                    {i + 1 < runningStep ? '✓' : i + 1 === runningStep ? '●' : '○'}
                  </span>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Output */}
        {step === 3 && output && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-accent-2 text-sm bg-accent-2/8 border border-accent-2/20 rounded-xl px-4 py-3">
              <CheckCircle2 size={16} />
              Agent completed · {agent.credit_cost} credits used · {((output.token_usage?.input || 0) + (output.token_usage?.output || 0)).toLocaleString()} tokens
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={handleCopy} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3">
                  <Copy size={12} /> Copy
                </button>
                <button onClick={handleDownload} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3">
                  <Download size={12} /> Download
                </button>
                <button
                  onClick={() => { setStep(1); setFormData({}); setOutput(null) }}
                  className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3 ml-auto"
                >
                  <RefreshCw size={12} /> Run again
                </button>
              </div>

              <OutputContent agentSlug={agent.slug} output={output} />
            </div>

            {/* Token metadata */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { l: 'Input tokens', v: output.token_usage?.input || 0 },
                { l: 'Output tokens', v: output.token_usage?.output || 0 },
                { l: 'Credits used', v: agent.credit_cost },
              ].map(({ l, v }) => (
                <div key={l} className="bg-bg-3 rounded-lg p-3">
                  <div className="text-[10px] text-text-3 uppercase tracking-wider">{l}</div>
                  <div className="font-heading font-bold text-base text-accent-2 mt-1">{v.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StepsBar({ currentStep }: { currentStep: Step }) {
  const steps = ['Input', 'Preview', 'Output']
  return (
    <div className="flex items-center mb-8">
      {steps.map((label, i) => {
        const n = (i + 1) as Step
        const done = n < currentStep
        const active = n === currentStep
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-heading transition-all',
                done ? 'bg-accent-2 text-black' : active ? 'bg-accent text-white' : 'bg-bg-3 border border-border text-text-3'
              )}>
                {done ? '✓' : n}
              </div>
              <span className={cn('text-xs font-medium', active ? 'text-text' : 'text-text-3')}>{label}</span>
            </div>
            {i < 2 && (
              <div className={cn('flex-1 h-px mx-3 max-w-10', done ? 'bg-accent-2' : 'bg-border')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function PreviewContent({ agentSlug, formData }: { agentSlug: string; formData: Record<string, unknown> }) {
  const previews: Record<string, React.ReactNode> = {
    'linkedin-tech-post': (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-semibold text-accent">LD</div>
          <div>
            <div className="text-xs font-semibold text-text">LinkedIn Creator Agent</div>
            <div className="text-[10px] text-text-3">Draft Preview · 1m</div>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-text-2">
          🚀 Just shipped something I&apos;m genuinely proud of — <strong className="text-text">
            {formData.github_url ? String(formData.github_url).split('/').pop() || 'my-new-project' : 'my-new-project'}
          </strong>!
        </p>
        <p className="text-sm leading-relaxed text-text-2">
          After battling several implementation details, this solution enables developer-friendly automated workflows out of the box...
        </p>
        <div className="flex gap-1.5 flex-wrap mt-2">
          {['#OpenSource', '#WebDev', '#NextJS', '#Solopreneur'].map(h => (
            <span key={h} className="text-accent text-xs font-medium">{h}</span>
          ))}
        </div>
        <div className="border-t border-border mt-3 pt-2 text-[10px] text-text-3 flex items-center gap-1.5 italic">
          <span>⚡ Dynamic content, repository stars, and language stats will be merged on execution.</span>
        </div>
      </div>
    ),
    'resume-ats-optimizer': (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <span className="text-xs font-semibold text-text flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-amber animate-pulse-dot" /> Pre-flight Scanner
          </span>
          <span className="text-[11px] text-text-3 font-mono">Status: Analyzed</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-3 border border-border rounded-lg p-3 text-center">
            <div className="text-[10px] text-text-3 uppercase tracking-wider">Estimated Score</div>
            <div className="text-xl font-heading font-extrabold text-brand-amber mt-1">72 / 100</div>
          </div>
          <div className="bg-bg-3 border border-border rounded-lg p-3">
            <div className="text-[10px] text-text-3 uppercase tracking-wider mb-1.5">Missing Key Terms</div>
            <div className="flex gap-1 flex-wrap">
              {['Kubernetes', 'CI/CD', 'Next.js'].map(badge => (
                <span key={badge} className="text-[9px] bg-brand-red/10 border border-brand-red/20 text-brand-red px-1.5 py-0.5 rounded font-medium">{badge}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="p-3 bg-bg-3 rounded-lg border border-border border-dashed text-center text-xs text-text-3 italic">
          A fully optimized resume will be produced, resolving keyword gaps.
        </div>
      </div>
    ),
    'github-portfolio': (
      <div className="space-y-3 font-mono text-xs">
        <div className="flex items-center gap-1.5 text-text-3 border-b border-border pb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-red/30" />
          <span className="w-2.5 h-2.5 rounded-full bg-brand-amber/30" />
          <span className="w-2.5 h-2.5 rounded-full bg-accent-2/30" />
          <span className="ml-1 text-[10px] tracking-wide">README-Preview.md</span>
        </div>
        <div className="space-y-2.5 pt-1 text-text-2">
          <div className="text-accent font-semibold text-sm"># Hi there, I&apos;m {formData.github_username ? String(formData.github_username) : 'Developer'} 👋</div>
          <div className="h-1 bg-border/40 w-3/4 rounded" />
          <div className="flex gap-1.5 mt-2">
            <span className="text-[9px] bg-accent/15 text-accent border border-accent/20 px-1.5 py-0.5 rounded">🚀 React / Next.js Specialist</span>
            <span className="text-[9px] bg-accent-2/15 text-accent-2 border border-accent-2/20 px-1.5 py-0.5 rounded">📦 Node.js / SQL</span>
          </div>
          <div className="text-text-3 mt-4 text-[10px] italic">Profile stats, top repository grids, and badge layouts will render automatically.</div>
        </div>
      </div>
    ),
    'meeting-notes-ai': (
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <span className="text-xs font-semibold text-text flex items-center gap-1.5">📝 Notes Scaffold</span>
          <span className="text-[10px] text-accent font-medium">Auto-structure active</span>
        </div>
        <div className="space-y-2 bg-bg-3 border border-border p-3 rounded-lg">
          <div className="text-[9px] text-text-3 uppercase tracking-wider">Executive Summary Template</div>
          <div className="space-y-1.5">
            <div className="h-2 bg-border w-full rounded" />
            <div className="h-2 bg-border w-5/6 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-text-3">
          <div className="border border-border rounded p-2 bg-bg-3/50">
            <div className="font-semibold text-text-2 mb-1">✓ Action Items Slot</div>
            <span>E.g., Owner: Task by Date</span>
          </div>
          <div className="border border-border rounded p-2 bg-bg-3/50">
            <div className="font-semibold text-text-2 mb-1">✦ Key Decisions Slot</div>
            <span>E.g., Agreed on Architecture</span>
          </div>
        </div>
      </div>
    ),
    'social-media-pack': (
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
          <span className="text-xs font-semibold text-text">Multi-Platform Campaign</span>
          <span className="text-[10px] bg-accent/10 border border-accent/20 text-accent px-1.5 py-0.5 rounded font-medium">3 Posts Ready</span>
        </div>
        <div className="space-y-2">
          <div className="bg-bg-3 border border-border rounded-lg p-2.5 flex items-start gap-2">
            <span className="text-xs">🐦</span>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold text-text block">Twitter/X Thread Starter</span>
              <span className="text-[10px] text-text-3 block mt-0.5 truncate">Hot take: Let&apos;s talk about {formData.topic ? String(formData.topic) : 'your topic'}...</span>
            </div>
          </div>
          <div className="bg-bg-3 border border-border rounded-lg p-2.5 flex items-start gap-2">
            <span className="text-xs">💼</span>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold text-text block">LinkedIn Insight Builder</span>
              <span className="text-[10px] text-text-3 block mt-0.5 truncate">We often overlook how critical {formData.topic ? String(formData.topic) : 'this area'} is in production...</span>
            </div>
          </div>
        </div>
      </div>
    ),
    'assignment-verifier': (
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <span className="text-xs font-semibold text-text">Academic Verification Matrix</span>
          <span className="text-[10px] text-brand-red font-medium flex items-center gap-1">● Integrity check</span>
        </div>
        <div className="space-y-2">
          {[
            { l: 'Quality Evaluation Rubric', w: 'w-full' },
            { l: 'AI Generation Check', w: 'w-2/3' },
            { l: 'Originality & Citation Scan', w: 'w-3/4' },
          ].map((bar, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-[9px] text-text-3 font-mono">
                <span>{bar.l}</span>
                <span>0%</span>
              </div>
              <div className="h-1.5 bg-bg-3 border border-border rounded-full overflow-hidden">
                <div className={`h-full bg-border rounded-full ${bar.w}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="text-[9px] text-text-3 text-center italic mt-2">
          Complete assessment metrics will populate upon runner execution.
        </div>
      </div>
    ),
  }
  return previews[agentSlug] || (
    <p className="text-text-3 text-xs italic">Preview will be generated based on your input. Click &ldquo;Run agent&rdquo; to see the full output.</p>
  )
}

function OutputContent({ agentSlug, output }: { agentSlug: string; output: WorkflowOutput }) {
  const [socialTab, setSocialTab] = useState<string>('Twitter/X')
  const [githubTab, setGithubTab] = useState<'preview' | 'raw'>('preview')
  const [copied, setCopied] = useState<boolean>(false)

  if (agentSlug === 'linkedin-tech-post' && output.post_body) {
    return (
      <div>
        <div className="bg-bg-3 rounded-lg p-4 text-sm text-text leading-relaxed border-l-2 border-accent mb-3 whitespace-pre-wrap">
          {output.post_body}
        </div>
        {output.hashtags && (
          <div className="flex gap-1.5 flex-wrap">
            {output.hashtags.map(h => (
              <span key={h} className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full font-medium">{h}</span>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (agentSlug === 'resume-ats-optimizer' && output.rewritten_resume) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-bg-3 border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Award size={20} />
            </div>
            <div>
              <div className="text-xs text-text-3 font-medium">ATS Optimization Rating</div>
              <div className="text-sm font-heading font-semibold text-text mt-0.5">Resume Core Quality</div>
            </div>
          </div>
          <div className="text-right">
            <span className={cn('font-heading font-extrabold text-2xl', (output.score || 0) >= 80 ? 'text-accent-2' : 'text-brand-amber')}>
              {output.score}/105
            </span>
            <div className="text-[10px] text-text-3 mt-0.5 font-medium">Score Rating</div>
          </div>
        </div>

        {output.suggestions && output.suggestions.length > 0 && (
          <div className="bg-bg-3 border border-border rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-heading font-bold text-text-2 flex items-center gap-1.5 mb-2">
              <Sparkles size={13} className="text-brand-amber" /> Optimization Recommendations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-text-2">
              {output.suggestions.map((rec, i) => (
                <div key={i} className="flex gap-2 p-2 bg-bg-4 border border-border/50 rounded-lg">
                  <span className="text-brand-amber font-bold"># {i + 1}</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs text-text-3 uppercase tracking-wider font-semibold">Rewritten & Optimized Resume Content</label>
          <div className="bg-bg-3 border border-border rounded-xl p-4 text-xs text-text-2 leading-relaxed font-mono whitespace-pre-wrap max-h-96 overflow-y-auto relative group">
            <button
              onClick={() => {
                navigator.clipboard.writeText(output.rewritten_resume || '')
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="absolute top-3 right-3 text-[10px] bg-bg-4 border border-border text-text-2 hover:text-text px-2 py-1 rounded transition-colors flex items-center gap-1"
            >
              {copied ? <Check size={11} className="text-accent-2" /> : <Copy size={11} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            {output.rewritten_resume}
          </div>
        </div>
      </div>
    )
  }

  if (agentSlug === 'meeting-notes-ai' && output.summary) {
    return (
      <div className="space-y-4">
        <div className="bg-bg-3 border border-border rounded-xl p-4 space-y-1.5">
          <div className="text-[10px] text-accent font-semibold uppercase tracking-widest">Executive Summary</div>
          <p className="text-sm text-text leading-relaxed">{output.summary}</p>
        </div>

        {output.decisions && output.decisions.length > 0 && (
          <div className="bg-bg-3 border border-border rounded-xl p-4 space-y-2">
            <div className="text-[10px] text-accent-2 font-semibold uppercase tracking-widest">Core Decisions Made</div>
            <div className="space-y-1.5">
              {output.decisions.map((decision, i) => (
                <div key={i} className="flex gap-2 text-xs text-text-2">
                  <span className="text-accent-2">✦</span>
                  <span className="font-medium">{decision}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {output.action_items && output.action_items.length > 0 && (
          <div className="bg-bg-3 border border-border rounded-xl p-4 space-y-2">
            <div className="text-[10px] text-brand-amber font-semibold uppercase tracking-widest">Action Tasks Assigned</div>
            <ul className="space-y-1.5">
              {output.action_items.map((item, i) => (
                <li key={i} className="text-xs text-text-2 flex gap-2.5 items-start">
                  <span className="bg-brand-amber/10 text-brand-amber border border-brand-amber/20 rounded px-1.5 py-0.5 text-[9px] font-mono shrink-0">TODO</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  if (agentSlug === 'social-media-pack' && Array.isArray(output.posts)) {
    const activePost = output.posts.find(p => p.platform === socialTab) || output.posts[0]
    
    const platformIcons: Record<string, string> = {
      'Twitter/X': '🐦',
      'LinkedIn': '💼',
      'Instagram': '📸',
    }

    return (
      <div className="space-y-4 animate-fade-in">
        {/* Tab switcher */}
        <div className="flex bg-bg-3 border border-border rounded-xl p-1 gap-1">
          {output.posts.map(p => (
            <button
              key={p.platform}
              onClick={() => {
                setSocialTab(p.platform)
                setCopied(false)
              }}
              className={cn(
                'flex-1 py-2 rounded-lg text-xs font-semibold font-heading transition-all flex items-center justify-center gap-1.5',
                socialTab === p.platform
                  ? 'bg-bg-4 border border-border/80 text-text shadow-sm'
                  : 'text-text-3 hover:text-text-2'
              )}
            >
              <span>{platformIcons[p.platform] || '📱'}</span>
              <span>{p.platform}</span>
            </button>
          ))}
        </div>

        {/* Mockup Container */}
        {activePost && (
          <div className="card border-border-2 p-5 bg-bg-3/50 shadow-xl relative animate-fade-in">
            {/* Action Copy for current platform */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(activePost.content || '')
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
              className="absolute top-4 right-4 text-[10px] bg-bg-3 border border-border text-text-2 hover:text-text px-2 py-1 rounded transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check size={11} className="text-accent-2" /> : <Copy size={11} />}
              {copied ? 'Copied Post' : 'Copy Post'}
            </button>

            {/* TWITTER/X PREMIUM SPECIFIC MOCKUP */}
            {activePost.platform === 'Twitter/X' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-purple-600 flex items-center justify-center font-heading text-sm font-bold text-white shadow">X</div>
                  <div>
                    <div className="text-xs font-bold text-text flex items-center gap-1">
                      Creator Account
                      <span className="text-[10px] text-accent">✔</span>
                    </div>
                    <div className="text-[10px] text-text-3 font-mono">@social_creator · Just now</div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-text whitespace-pre-wrap border-l border-border/40 pl-3">
                  {activePost.content}
                </p>
                <div className="flex items-center justify-between border-t border-border/40 pt-3 text-text-3 text-xs px-2 max-w-sm">
                  <span className="flex items-center gap-1.5 hover:text-accent cursor-pointer transition-colors"><MessageCircle size={13} /> 12</span>
                  <span className="flex items-center gap-1.5 hover:text-accent-2 cursor-pointer transition-colors"><Repeat2 size={13} /> 48</span>
                  <span className="flex items-center gap-1.5 hover:text-brand-red cursor-pointer transition-colors"><Heart size={13} /> 156</span>
                  <span className="flex items-center gap-1.5 hover:text-accent cursor-pointer transition-colors"><Share size={13} /></span>
                </div>
              </div>
            )}

            {/* LINKEDIN PREMIUM SPECIFIC MOCKUP */}
            {activePost.platform === 'LinkedIn' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-border flex items-center justify-center font-heading text-sm font-semibold text-text shadow">💼</div>
                  <div>
                    <div className="text-xs font-bold text-text flex items-center gap-1">
                      Creator Executive
                      <span className="text-[9px] bg-bg-4 border border-border text-text-2 px-1 rounded-sm">1st</span>
                    </div>
                    <div className="text-[9px] text-text-3 font-medium">Productivity Specialist | AI Lead</div>
                    <div className="text-[9px] text-text-3 font-medium">1m · Edited · 🌐</div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-text-2 whitespace-pre-wrap pl-1">
                  {activePost.content}
                </p>
                <div className="flex items-center justify-between border-t border-border/40 pt-3 text-[10px] text-text-3 px-1">
                  <span className="flex items-center gap-1 hover:text-accent cursor-pointer transition-colors"><ThumbsUp size={12} /> Like</span>
                  <span className="flex items-center gap-1 hover:text-accent cursor-pointer transition-colors"><MessageSquare size={12} /> Comment</span>
                  <span className="flex items-center gap-1 hover:text-accent cursor-pointer transition-colors"><Repeat2 size={12} /> Repost</span>
                  <span className="flex items-center gap-1 hover:text-accent cursor-pointer transition-colors"><Send size={12} /> Send</span>
                </div>
              </div>
            )}

            {/* INSTAGRAM PREMIUM SPECIFIC MOCKUP */}
            {activePost.platform === 'Instagram' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-amber to-brand-red p-0.5">
                    <div className="w-full h-full rounded-full bg-bg-2 flex items-center justify-center text-xs">📸</div>
                  </div>
                  <span className="text-xs font-bold text-text">instagram_influencer</span>
                </div>
                <div className="bg-gradient-to-tr from-[#833ab4] via-[#fd1d1d] to-[#fcb045] h-36 rounded-xl flex flex-col items-center justify-center text-center p-4 border border-border shadow-inner text-white">
                  <Sparkles size={24} className="text-white animate-pulse" />
                  <span className="text-[10px] font-heading uppercase tracking-widest font-bold mt-2">Visual Prompt Generated</span>
                  <p className="text-[9px] mt-1 opacity-90 max-w-xs truncate leading-normal">
                    {output.metadata?.visual_prompt as string || 'Dynamic abstract high-engagement layout template'}
                  </p>
                </div>
                <p className="text-xs leading-relaxed text-text pl-1">
                  <strong className="font-bold text-text-2 mr-1.5">instagram_influencer</strong>
                  <span className="whitespace-pre-wrap text-text-2">{activePost.content}</span>
                </p>
                <div className="text-[9px] text-text-3 font-semibold pl-1">Liked by 1,024 developers · 1 minute ago</div>
              </div>
            )}
          </div>
        )}

        {output.hashtags && output.hashtags.length > 0 && (
          <div className="bg-bg-3 border border-border rounded-xl p-3 flex flex-wrap gap-1.5">
            {output.hashtags.map((h: string) => (
              <span key={h} className="text-xs bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded-full font-semibold">{h}</span>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (agentSlug === 'github-portfolio' && output.readme_content) {
    return (
      <div className="space-y-4">
        {/* Toggle Bar */}
        <div className="flex bg-bg-3 border border-border rounded-xl p-1 gap-1">
          <button
            onClick={() => {
              setGithubTab('preview')
              setCopied(false)
            }}
            className={cn(
              'flex-1 py-2 rounded-lg text-xs font-semibold font-heading transition-all flex items-center justify-center gap-1.5',
              githubTab === 'preview'
                ? 'bg-bg-4 border border-border/80 text-text'
                : 'text-text-3 hover:text-text-2'
            )}
          >
            <Sparkles size={13} className="text-accent-2" />
            <span>Rendered Preview</span>
          </button>
          <button
            onClick={() => {
              setGithubTab('raw')
              setCopied(false)
            }}
            className={cn(
              'flex-1 py-2 rounded-lg text-xs font-semibold font-heading transition-all flex items-center justify-center gap-1.5',
              githubTab === 'raw'
                ? 'bg-bg-4 border border-border/80 text-text'
                : 'text-text-3 hover:text-text-2'
            )}
          >
            <FileCode size={13} />
            <span>Raw Markdown</span>
          </button>
        </div>

        {githubTab === 'preview' ? (
          <div className="bg-bg-3 border border-border rounded-xl p-5 text-sm text-text leading-relaxed font-sans max-h-96 overflow-y-auto animate-fade-in prose prose-invert max-w-none">
            {parseMarkdownToElements(output.readme_content)}
          </div>
        ) : (
          <div className="space-y-1.5 relative group animate-fade-in">
            <button
              onClick={() => {
                navigator.clipboard.writeText(output.readme_content || '')
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="absolute top-3 right-3 text-[10px] bg-bg-4 border border-border text-text-2 hover:text-text px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check size={11} className="text-accent-2" /> : <Copy size={11} />}
              {copied ? 'Copied' : 'Copy Markdown'}
            </button>
            <pre className="bg-bg-3 border border-border rounded-xl p-5 text-xs text-text font-mono whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
              {output.readme_content}
            </pre>
          </div>
        )}
      </div>
    )
  }

  if (agentSlug === 'assignment-verifier') {
    const getScoreColor = (score: number = 0) => {
      if (score >= 80) return 'text-accent-2 border-accent-2/20 bg-accent-2/5'
      if (score >= 50) return 'text-brand-amber border-brand-amber/20 bg-brand-amber/5'
      return 'text-brand-red border-brand-red/20 bg-brand-red/5'
    }

    const getScoreBarBg = (score: number = 0) => {
      if (score >= 80) return 'bg-accent-2'
      if (score >= 50) return 'bg-brand-amber'
      return 'bg-brand-red'
    }

    return (
      <div className="space-y-4">
        {/* Score Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Quality Card */}
          <div className={cn('border rounded-xl p-4 flex flex-col justify-between h-32 transition-all', getScoreColor(output.quality_score))}>
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest font-heading opacity-90">Academic Quality</span>
              <Award size={18} className="opacity-80" />
            </div>
            <div className="mt-2">
              <div className="font-heading font-extrabold text-2xl tracking-tight">{output.quality_score || 0}<span className="text-xs font-normal opacity-70">/100</span></div>
              <div className="h-1.5 bg-bg-4/40 rounded-full mt-2 overflow-hidden">
                <div className={cn('h-full rounded-full', getScoreBarBg(output.quality_score))} style={{ width: `${output.quality_score || 0}%` }} />
              </div>
            </div>
          </div>

          {/* AI Probability Card */}
          <div className={cn('border rounded-xl p-4 flex flex-col justify-between h-32 transition-all', (output.ai_probability || 0) < 30 ? 'text-accent-2 border-accent-2/20 bg-accent-2/5' : (output.ai_probability || 0) < 60 ? 'text-brand-amber border-brand-amber/20 bg-brand-amber/5' : 'text-brand-red border-brand-red/20 bg-brand-red/5')}>
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest font-heading opacity-90">AI Likelihood</span>
              <Cpu size={18} className="opacity-80" />
            </div>
            <div className="mt-2">
              <div className="font-heading font-extrabold text-2xl tracking-tight">{output.ai_probability || 0}<span className="text-xs font-normal opacity-70">%</span></div>
              <div className="h-1.5 bg-bg-4/40 rounded-full mt-2 overflow-hidden">
                <div className={cn('h-full rounded-full', (output.ai_probability || 0) < 30 ? 'bg-accent-2' : (output.ai_probability || 0) < 60 ? 'bg-brand-amber' : 'bg-brand-red')} style={{ width: `${output.ai_probability || 0}%` }} />
              </div>
            </div>
          </div>

          {/* Plagiarism Card */}
          <div className={cn('border rounded-xl p-4 flex flex-col justify-between h-32 transition-all', (output.plagiarism_score || 0) < 20 ? 'text-accent-2 border-accent-2/20 bg-accent-2/5' : (output.plagiarism_score || 0) < 45 ? 'text-brand-amber border-brand-amber/20 bg-brand-amber/5' : 'text-brand-red border-brand-red/20 bg-brand-red/5')}>
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest font-heading opacity-90">Similarity Scan</span>
              <ShieldAlert size={18} className="opacity-80" />
            </div>
            <div className="mt-2">
              <div className="font-heading font-extrabold text-2xl tracking-tight">{output.plagiarism_score || 0}<span className="text-xs font-normal opacity-70">%</span></div>
              <div className="h-1.5 bg-bg-4/40 rounded-full mt-2 overflow-hidden">
                <div className={cn('h-full rounded-full', (output.plagiarism_score || 0) < 20 ? 'bg-accent-2' : (output.plagiarism_score || 0) < 45 ? 'bg-brand-amber' : 'bg-brand-red')} style={{ width: `${output.plagiarism_score || 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        {(output.strengths || output.improvements) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {output.strengths && output.strengths.length > 0 && (
              <div className="bg-bg-3 border border-border rounded-xl p-4">
                <h4 className="text-xs font-heading font-bold text-accent-2 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Solid Accomplishments
                </h4>
                <ul className="space-y-1.5 text-xs text-text-2">
                  {output.strengths.map((str: string, i: number) => (
                    <li key={i} className="flex gap-2 items-start">
                      <span className="text-accent-2 font-bold shrink-0">✓</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {output.improvements && output.improvements.length > 0 && (
              <div className="bg-bg-3 border border-border rounded-xl p-4">
                <h4 className="text-xs font-heading font-bold text-brand-amber mb-2 flex items-center gap-1.5">
                  <Sparkles size={13} /> Recommendations to Enhance
                </h4>
                <ul className="space-y-1.5 text-xs text-text-2">
                  {output.improvements.map((imp: string, i: number) => (
                    <li key={i} className="flex gap-2 items-start">
                      <span className="text-brand-amber font-bold shrink-0">✦</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Feedback Text */}
        {output.feedback && (
          <div className="bg-bg-3 border border-border rounded-xl p-4 space-y-1">
            <div className="text-[10px] text-text-3 font-semibold uppercase tracking-widest">Constructive Assessment Summary</div>
            <p className="text-sm text-text-2 leading-relaxed whitespace-pre-wrap">{output.feedback}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <pre className="bg-bg-3 rounded-lg p-4 text-xs text-text leading-relaxed overflow-x-auto whitespace-pre-wrap">
      {JSON.stringify(output, null, 2)}
    </pre>
  )
}

// ============================================
// Markdown Parsing Helpers
// ============================================

function parseMarkdownToElements(markdown: string) {
  if (!markdown) return null
  const lines = markdown.split('\n')
  return lines.map((line, index) => {
    if (line.startsWith('# ')) {
      return <h1 key={index} className="font-heading font-extrabold text-2xl border-b border-border pb-2 mt-5 mb-3 text-text">{line.replace('# ', '')}</h1>
    }
    if (line.startsWith('## ')) {
      return <h2 key={index} className="font-heading font-bold text-xl mt-4 mb-2 text-accent">{line.replace('## ', '')}</h2>
    }
    if (line.startsWith('### ')) {
      return <h3 key={index} className="font-heading font-semibold text-lg mt-3 mb-1.5 text-accent-2">{line.replace('### ', '')}</h3>
    }
    if (line.startsWith('> ')) {
      return <blockquote key={index} className="border-l-4 border-accent pl-3 py-1 text-text-2 italic bg-accent/5 my-2 rounded">{line.replace('> ', '')}</blockquote>
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const cleanLine = line.replace(/^[-*]\s+/, '')
      return <li key={index} className="ml-4 list-disc text-sm text-text-2 my-1">{parseInlineStyles(cleanLine)}</li>
    }
    
    if (line.trim() === '') return <div key={index} className="h-2" />
    
    return <p key={index} className="text-sm text-text-2 leading-relaxed my-2">{parseInlineStyles(line)}</p>
  })
}

function parseInlineStyles(text: string) {
  const regex = /(\*\*.*?\*\*|`.*?`)/g
  const parts = text.split(regex)

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold text-text">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} className="bg-bg-4 border border-border text-accent-2 px-1.5 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>
    }
    return part
  })
}
