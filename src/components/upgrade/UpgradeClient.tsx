'use client'

import Link from 'next/link'
import { Check, Zap, Star, Building2 } from 'lucide-react'

export default function UpgradeClient() {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Perfect for trying out AI automation',
      credits: 50,
      icon: <Zap size={20} />,
      color: 'border-border',
      badge: null,
      features: [
        '50 credits per month',
        '4 core agents',
        'Download outputs',
        'Workflow history (30 days)',
        'Community support',
      ],
      cta: 'Current plan',
      ctaDisabled: true,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$12',
      period: '/month',
      description: 'For professionals who ship daily',
      credits: 1000,
      icon: <Star size={20} />,
      color: 'border-accent',
      badge: 'Most popular',
      features: [
        '1,000 credits per month',
        'All 6+ agents',
        'Priority Gemini 1.5 Pro',
        'Scheduled workflows',
        'Workflow history (unlimited)',
        'OAuth integrations (GitHub, Drive)',
        'Priority support',
        'Early access to new agents',
      ],
      cta: 'Upgrade to Pro',
      ctaDisabled: false,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$49',
      period: '/month',
      description: 'For teams with high-volume needs',
      credits: 10000,
      icon: <Building2 size={20} />,
      color: 'border-border',
      badge: null,
      features: [
        '10,000 credits per month',
        'All agents + custom agents',
        'Team collaboration',
        'SSO & advanced admin',
        'Dedicated support',
        'SLA guarantee',
        'Custom integrations',
        'Analytics API access',
      ],
      cta: 'Contact sales',
      ctaDisabled: false,
    },
  ]

  return (
    <main className="min-h-screen bg-bg auth-bg">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <Link href="/dashboard" className="text-xs text-text-3 hover:text-accent transition-colors mb-8 inline-block">
            ← Back to dashboard
          </Link>
          <h1 className="font-heading font-extrabold text-4xl mb-4">
            Upgrade your{' '}
            <span className="bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
              AI workforce
            </span>
          </h1>
          <p className="text-text-2 text-lg max-w-xl mx-auto leading-relaxed">
            More credits, more agents, more automation. Ship faster.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-bg-2 border-2 rounded-2xl p-6 flex flex-col ${plan.color} ${
                plan.id === 'pro' ? 'shadow-lg shadow-accent/10' : ''
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  plan.id === 'pro' ? 'bg-accent/20 text-accent' :
                  plan.id === 'enterprise' ? 'bg-accent-3/20 text-accent-3' :
                  'bg-bg-3 text-text-2'
                }`}>
                  {plan.icon}
                </div>
                <h2 className="font-heading font-bold text-xl">{plan.name}</h2>
                <p className="text-text-3 text-xs mt-0.5">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="font-heading font-extrabold text-4xl">{plan.price}</span>
                  <span className="text-text-3 text-sm">{plan.period}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-brand-amber">⬡</span>
                  <span className="text-sm font-semibold">{plan.credits.toLocaleString()}</span>
                  <span className="text-text-3 text-xs">credits / month</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-text-2">
                    <Check size={13} className="text-accent-2 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.ctaDisabled ? (
                <button
                  disabled
                  className="w-full text-center text-sm py-2.5 bg-bg-3 border border-border text-text-3 rounded-xl cursor-not-allowed"
                >
                  {plan.cta}
                </button>
              ) : plan.id === 'enterprise' ? (
                <a
                  href="mailto:sales@workforce-ai.com"
                  className="w-full text-center text-sm py-2.5 border border-border text-text-2 hover:border-border-2 hover:text-text rounded-xl transition-colors block"
                >
                  {plan.cta}
                </a>
              ) : (
                <button
                  onClick={() => alert('Stripe checkout coming soon! Contact us to upgrade manually.')}
                  className="w-full btn-primary text-sm py-2.5 rounded-xl bg-gradient-to-r from-accent to-purple-600"
                >
                  {plan.cta} →
                </button>
              )}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-xl mx-auto space-y-4">
          <h3 className="font-heading font-bold text-base text-center mb-6">Common questions</h3>
          {[
            { q: 'What happens when I run out of credits?', a: 'Your workflows pause until next month\'s refill or you upgrade. You\'ll always be notified before a run.' },
            { q: 'Do credits roll over?', a: 'On the free plan, credits reset monthly. Pro and Enterprise plans allow up to 50% rollover.' },
            { q: 'Can I cancel anytime?', a: 'Yes, no questions asked. You\'ll keep your credits until the end of the billing period.' },
            { q: 'What AI models do you use?', a: 'We use Gemini 1.5 Pro for complex tasks and Gemini Flash / Ollama for lighter summarization tasks.' },
          ].map(({ q, a }) => (
            <div key={q} className="card p-4">
              <div className="font-medium text-sm mb-1.5">{q}</div>
              <div className="text-text-2 text-xs leading-relaxed">{a}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
