import SignInForm from '@/app/components/auth/SignInForm'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Welcome to Action Bias
          </h2>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Your personal financial portfolio manager
          </p>
        </div>
        
        <div className="glass-card rounded-2xl p-8 border" style={{
          background: 'var(--glass-card)',
          borderColor: 'var(--glass-border)',
          boxShadow: 'var(--shadow-glass)'
        }}>
          <SignInForm />
        </div>
        
        <div className="text-center">
          <p className="text-sm" style={{ color: 'var(--text-quaternary)' }}>
            Secure, passwordless authentication
          </p>
        </div>
      </div>
    </div>
  )
} 