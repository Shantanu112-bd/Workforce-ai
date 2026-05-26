import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="auth-bg min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🤖</div>
        <h1 className="font-heading font-extrabold text-4xl mb-2">404</h1>
        <p className="text-text-2 text-lg mb-6">This page doesn&apos;t exist... yet.</p>
        <Link href="/dashboard" className="btn-primary">
          ← Back to dashboard
        </Link>
      </div>
    </main>
  )
}
