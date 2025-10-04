// OAuth User Profile Component
import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

interface UserProfileProps {
  className?: string
}

export function UserProfile({ className = '' }: UserProfileProps) {
  const { user, signOut, isLoading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className={`flex items-center space-x-3 p-2 rounded-lg ${className}`}>
        <div className="w-8 h-8 bg-app-sand/20 rounded-full animate-pulse"></div>
        <div className="text-left">
          <div className="w-16 h-4 bg-app-sand/20 rounded animate-pulse"></div>
          <div className="w-20 h-3 bg-app-sand/20 rounded animate-pulse mt-1"></div>
        </div>
      </div>
    )
  }

  // Don't render if user is not authenticated
  if (!user) return null

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsOpen(false)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className={`relative animate-in fade-in duration-300 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-app-sand/20 transition-colors"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-app-sand rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-app-navy">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="text-left">
          <p className="text-sm font-medium text-app-white">{user.name}</p>
          <p className="text-xs text-app-sand">{user.email}</p>
        </div>
        <svg
          className={`w-4 h-4 text-app-sand transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-app-navy-light rounded-lg shadow-lg border border-app-sand/20 z-20">
            <div className="p-4 border-b border-app-sand/20">
              <p className="text-sm font-medium text-app-white">{user.name}</p>
              <p className="text-sm text-app-sand">{user.email}</p>
              <p className="text-xs text-app-sand/70 mt-1">
                Signed in with {user.provider}
              </p>
            </div>
            
            <div className="p-2">
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full flex items-center px-3 py-2 text-sm text-app-white hover:bg-app-sand/20 rounded-md transition-colors disabled:opacity-50"
              >
                <svg
                  className="w-4 h-4 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                {isLoading ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}