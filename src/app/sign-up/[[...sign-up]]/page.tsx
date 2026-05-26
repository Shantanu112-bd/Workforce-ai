import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="auth-bg min-h-screen flex items-center justify-center p-6">
      <div className="text-center mb-8 absolute top-8 left-1/2 -translate-x-1/2">
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-base">⚡</div>
          <span className="font-heading font-bold text-base">WorkForce AI</span>
        </div>
      </div>
      <SignUp
        appearance={{
          variables: {
            colorPrimary: '#6C63FF',
            colorBackground: '#111118',
            colorInputBackground: '#1A1A24',
            colorText: '#F0F0F8',
            colorInputText: '#F0F0F8',
            colorTextSecondary: '#8888A8',
            borderRadius: '0.75rem',
          },
          elements: {
            card: 'bg-bg-2 border border-border shadow-2xl',
            headerTitle: 'font-heading font-bold',
          },
        }}
      />
    </main>
  )
}
