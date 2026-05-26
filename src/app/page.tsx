import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <main className="auth-bg min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-sm">⚡</div>
          <span className="font-heading font-bold text-base">WorkForce AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="btn-secondary">Sign in</Link>
          <Link href="/sign-up" className="btn-primary">Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-8 py-20">
        <div className="max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 text-xs text-accent font-medium mb-8">
            ✨ 6 AI agents ready to use — no setup required
          </div>
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl leading-tight mb-6">
            Your AI workforce,<br />
            <span className="text-accent">curated and ready.</span>
          </h1>
          <p className="text-text-2 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Stop wasting hours on repetitive tasks. Run prebuilt AI workflows for your GitHub, resume, meetings, and content — in seconds.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/sign-up" className="btn-primary text-base px-7 py-3">
              Start free — 50 credits ⚡
            </Link>
            <Link href="/sign-in" className="btn-secondary text-base px-6 py-3">
              Sign in →
            </Link>
          </div>
          <p className="text-text-3 text-xs mt-6">No credit card. Free plan includes 50 credits/month.</p>
        </div>
      </section>

      {/* Feature grid */}
      <section className="px-8 pb-20">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: '🔗', title: 'LinkedIn Tech Post', sub: '3 credits', cat: 'Developer' },
            { icon: '📄', title: 'Resume ATS Optimizer', sub: '5 credits', cat: 'Developer' },
            { icon: '🎙️', title: 'Meeting Notes AI', sub: '4 credits', cat: 'Business' },
            { icon: '📱', title: 'Social Media Pack', sub: '2 credits', cat: 'Creator' },
            { icon: '🏆', title: 'GitHub Portfolio', sub: '3 credits', cat: 'Developer' },
            { icon: '✅', title: 'Assignment Verifier', sub: '4 credits', cat: 'Teacher' },
          ].map((a) => (
            <div key={a.title} className="card p-4">
              <div className="text-2xl mb-2">{a.icon}</div>
              <div className="font-heading font-semibold text-sm mb-1">{a.title}</div>
              <div className="text-text-3 text-xs">{a.cat} · {a.sub}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
