'use client'

import { Database, AlertTriangle, RefreshCw, Terminal } from 'lucide-react'

interface DbErrorViewProps {
  error?: string
}

export default function DbErrorView({ error }: DbErrorViewProps) {
  return (
    <main className="auth-bg min-h-screen flex items-center justify-center p-6 text-text">
      <div className="max-w-xl w-full card bg-bg-2 border border-border p-8 shadow-2xl rounded-2xl relative overflow-hidden animate-fade-in">
        {/* Glow effects */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-accent/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-brand-amber/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-brand-red mb-6 animate-pulse-dot">
            <Database size={32} />
          </div>

          <h1 className="font-heading font-extrabold text-2xl md:text-3xl mb-3 tracking-tight">
            Database Connection Error
          </h1>
          
          <p className="text-text-2 text-sm md:text-base leading-relaxed mb-6">
            WorkForce AI is unable to connect to the database. This typically happens when environment variables are missing, invalid, or the Supabase project has been paused/deleted.
          </p>

          {error && (
            <div className="w-full text-left bg-bg-3 border border-border rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-brand-red font-medium text-xs uppercase tracking-wider mb-1">
                <AlertTriangle size={14} />
                <span>Error details</span>
              </div>
              <p className="text-xs font-mono text-text-2 break-all">{error}</p>
            </div>
          )}

          <div className="w-full text-left border-t border-border pt-6 mb-6">
            <h3 className="font-heading font-bold text-sm text-text-2 mb-3 flex items-center gap-2">
              <Terminal size={16} className="text-accent" />
              How to fix this?
            </h3>
            <ul className="text-xs text-text-2 space-y-3 list-decimal list-inside">
              <li>
                Verify that <code className="text-accent bg-bg-3 px-1.5 py-0.5 rounded font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-accent bg-bg-3 px-1.5 py-0.5 rounded font-mono">SUPABASE_SERVICE_ROLE_KEY</code> are correctly configured in your Vercel project environment variables.
              </li>
              <li>
                Make sure the Supabase database instance is active. You can check the status in your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Supabase Dashboard</a>.
              </li>
              <li>
                Verify that the database schema is initialized by running queries from <code className="text-accent bg-bg-3 px-1.5 py-0.5 rounded font-mono">supabase/schema.sql</code> inside the SQL editor.
              </li>
            </ul>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm font-semibold"
            >
              <RefreshCw size={14} />
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
