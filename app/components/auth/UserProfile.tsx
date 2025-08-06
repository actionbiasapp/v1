'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function UserProfile() {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(session?.user?.name || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      
      if (response.ok) {
        setIsEditing(false)
        // Refresh session to get updated name
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/user/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `action-bias-data-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to export data:', error)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This will permanently delete your account and all data.')) {
      return
    }
    
    try {
      const response = await fetch('/api/user/delete', { method: 'DELETE' })
      if (response.ok) {
        window.location.href = '/auth/signin'
      }
    } catch (error) {
      console.error('Failed to delete account:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-lg border" style={{
        background: 'var(--glass-card)',
        borderColor: 'var(--glass-border)'
      }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Profile Settings
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Email
            </label>
            <input
              type="email"
              value={session?.user?.email || ''}
              disabled
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-gray-300"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-quaternary)' }}>
              Email cannot be changed
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Display Name
            </label>
            {isEditing ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md"
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderColor: 'var(--glass-border)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--glass-border)'
                  }}
                />
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 rounded-md font-medium transition-all"
                  style={{
                    background: 'var(--success-bg)',
                    color: 'var(--success-text)',
                    border: '1px solid var(--success-border)'
                  }}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-md font-medium transition-all"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--glass-border)'
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--text-primary)' }}>{name}</span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm px-2 py-1 rounded transition-all"
                  style={{
                    background: 'var(--info-bg)',
                    color: 'var(--info-text)',
                    border: '1px solid var(--info-border)'
                  }}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 rounded-lg border" style={{
        background: 'var(--glass-card)',
        borderColor: 'var(--glass-border)'
      }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Data Management
        </h3>
        
        <div className="space-y-4">
          <button
            onClick={handleExportData}
            className="w-full px-4 py-2 rounded-md font-medium transition-all"
            style={{
              background: 'var(--info-bg)',
              color: 'var(--info-text)',
              border: '1px solid var(--info-border)'
            }}
          >
            Export My Data
          </button>
          
          <button
            onClick={handleDeleteAccount}
            className="w-full px-4 py-2 rounded-md font-medium transition-all"
            style={{
              background: 'var(--error-bg)',
              color: 'var(--error-text)',
              border: '1px solid var(--error-border)'
            }}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
} 