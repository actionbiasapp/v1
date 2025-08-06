import UserProfile from '@/app/components/auth/UserProfile'

export default function ProfilePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Account Settings
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Manage your profile and data
          </p>
        </div>
        
        <UserProfile />
      </div>
    </div>
  )
} 