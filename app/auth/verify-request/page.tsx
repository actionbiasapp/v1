export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-md w-full space-y-8 text-center p-8">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full" style={{ background: 'var(--info-bg)' }}>
          <svg className="h-6 w-6" style={{ color: 'var(--info)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Check your email
        </h2>
        
        <p style={{ color: 'var(--text-secondary)' }}>
          We've sent you a secure link to sign in to Action Bias.
        </p>
        
        <div className="p-4 rounded-md border" style={{
          background: 'var(--info-bg)',
          borderColor: 'var(--info-border)'
        }}>
          <h3 className="text-sm font-medium" style={{ color: 'var(--info-text)' }}>
            What happens next?
          </h3>
          <ul className="mt-2 text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
            <li>• Click the link in your email</li>
            <li>• You'll be securely signed in</li>
            <li>• Access your financial portfolio</li>
          </ul>
        </div>
        
        <p className="text-xs" style={{ color: 'var(--text-quaternary)' }}>
          The link will expire in 10 minutes for your security.
        </p>
      </div>
    </div>
  )
} 