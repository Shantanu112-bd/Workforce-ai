'use client'

import { useState } from 'react'
import { Github, Mail, Calendar, Linkedin, Twitter, BookOpen, HardDrive, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'
import { DBConnection, OAuthProvider } from '@/types'
import { cn, formatDate } from '@/lib/utils'

interface Props {
  connections: DBConnection[]
}

interface ProviderConfig {
  id: OAuthProvider
  name: string
  description: string
  icon: React.ReactNode
  color: string
  scope: string
  available: boolean
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Fetch repo data for LinkedIn posts and portfolio generation.',
    icon: <Github size={22} />,
    color: 'bg-[#1a1a2e] border-[#333]',
    scope: 'public_repo, read:user',
    available: true,
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Send AI-drafted emails and pull meeting context.',
    icon: <Mail size={22} />,
    color: 'bg-[#1f1010] border-[#3d1a1a]',
    scope: 'gmail.readonly, gmail.send',
    available: false,
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Schedule AI-generated reports and recurring tasks.',
    icon: <Calendar size={22} />,
    color: 'bg-[#101f10] border-[#1a3d1a]',
    scope: 'calendar.readonly',
    available: false,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Publish posts directly from the LinkedIn Tech Agent.',
    icon: <Linkedin size={22} />,
    color: 'bg-[#0f1b24] border-[#1a2d3d]',
    scope: 'w_member_social',
    available: false,
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    description: 'Post social media content from the Social Media Pack agent.',
    icon: <Twitter size={22} />,
    color: 'bg-[#0f0f1e] border-[#222]',
    scope: 'tweet.write',
    available: false,
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Save agent outputs directly to Notion pages and databases.',
    icon: <BookOpen size={22} />,
    color: 'bg-[#1a1a18] border-[#333]',
    scope: 'read_content, insert_content',
    available: false,
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'Import documents and export agent outputs to Drive.',
    icon: <HardDrive size={22} />,
    color: 'bg-[#0f1a1f] border-[#1a2d33]',
    scope: 'drive.file',
    available: false,
  },
]

export default function ConnectionsClient({ connections }: Props) {
  const [connecting, setConnecting] = useState<OAuthProvider | null>(null)

  const connectionMap = connections.reduce((acc, c) => {
    acc[c.provider] = c
    return acc
  }, {} as Record<OAuthProvider, DBConnection>)

  const handleConnect = async (provider: OAuthProvider) => {
    setConnecting(provider)
    // In production, redirect to OAuth flow
    // For MVP: show coming soon or redirect to /api/auth/connect/[provider]
    setTimeout(() => {
      alert(`OAuth connection for ${provider} will be available soon. For now, GitHub is connected via Clerk.`)
      setConnecting(null)
    }, 500)
  }

  const handleDisconnect = async (provider: OAuthProvider) => {
    if (!confirm(`Disconnect ${provider}? This may break workflows that use it.`)) return
    await fetch(`/api/connections/${provider}`, { method: 'DELETE' })
    window.location.reload()
  }

  const connectedCount = Object.keys(connectionMap).length

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 bg-bg-2/80 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="font-heading font-bold text-base">Connections</h1>
          <span className="text-xs text-text-3">
            {connectedCount} / {PROVIDERS.length} connected
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Info banner */}
        <div className="flex items-start gap-3 bg-accent/8 border border-accent/20 rounded-xl p-4">
          <AlertCircle size={16} className="text-accent shrink-0 mt-0.5" />
          <p className="text-text-2 text-xs leading-relaxed">
            Connect your tools to unlock the full power of AI agents. All connections use{' '}
            <strong className="text-text">OAuth with minimal scopes</strong> — we only request what&apos;s needed.
            No API keys are stored in plain text.
          </p>
        </div>

        {/* Provider grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PROVIDERS.map((provider) => {
            const connection = connectionMap[provider.id]
            const isConnected = !!connection?.is_active
            const isConnecting = connecting === provider.id

            return (
              <div
                key={provider.id}
                className={cn(
                  'card p-4 border transition-all',
                  isConnected ? 'border-accent-2/30' : 'border-border'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-text-2 border shrink-0', provider.color)}>
                    {provider.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-heading font-semibold text-sm">{provider.name}</span>
                      {isConnected && (
                        <span className="flex items-center gap-1 text-[10px] text-accent-2 font-medium">
                          <CheckCircle2 size={11} /> Connected
                        </span>
                      )}
                      {!provider.available && !isConnected && (
                        <span className="text-[10px] bg-bg-3 border border-border text-text-3 px-1.5 py-0.5 rounded-full font-medium">
                          Coming soon
                        </span>
                      )}
                    </div>
                    <p className="text-text-3 text-xs leading-relaxed mb-1">{provider.description}</p>
                    <p className="text-[10px] text-text-3">
                      Scope: <span className="text-text-2 font-mono">{provider.scope}</span>
                    </p>
                    {isConnected && connection.provider_username && (
                      <p className="text-[10px] text-accent mt-1">
                        @{connection.provider_username}
                        {connection.last_used_at && ` · last used ${formatDate(connection.last_used_at)}`}
                      </p>
                    )}
                  </div>

                  {/* Action */}
                  <div className="shrink-0">
                    {isConnected ? (
                      <button
                        onClick={() => handleDisconnect(provider.id)}
                        className="text-xs border border-border text-text-3 hover:border-brand-red hover:text-brand-red px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        Disconnect
                      </button>
                    ) : provider.available ? (
                      <button
                        onClick={() => handleConnect(provider.id)}
                        disabled={isConnecting}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <ExternalLink size={11} />
                        {isConnecting ? 'Connecting...' : 'Connect'}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="text-xs border border-border text-text-3 px-2.5 py-1.5 rounded-lg cursor-not-allowed opacity-50"
                      >
                        Soon
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Security note */}
        <div className="text-center">
          <p className="text-text-3 text-xs">
            🔒 All OAuth tokens are encrypted at rest. You can revoke access at any time.
          </p>
        </div>
      </div>
    </div>
  )
}
