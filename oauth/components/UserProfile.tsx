// OAuth User Profile Component
import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

interface UserProfileProps {
  className?: string
}

export function UserProfile({ className = '' }: UserProfileProps) {
  const { user, signOut, isLoading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

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
    setIsSigningOut(true)
    try {
      await signOut()
      setIsOpen(false)
      // Force a page reload to reset all state
      window.location.reload()
    } catch (error) {
      console.error('Sign out error:', error)
      setIsSigningOut(false)
    }
  }

  return (
    <div className={`relative z-50 animate-in fade-in duration-300 ${className}`}>
      {/* Profile Button */}
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

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            {/* User Info */}
            <div className="p-4 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-600 break-all">{user.email}</p>
              <p className="text-xs text-gray-500 mt-1 capitalize">
                Signed in with {user.provider}
              </p>
            </div>
            
            {/* Actions */}
            <div className="p-2 bg-white">
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                type="button"
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg
                  className="w-4 h-4 mr-3 flex-shrink-0 text-gray-500"
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
                <span className="flex-1 text-left text-gray-900 font-semibold">
                  {isSigningOut ? 'Signing out...' : 'Sign out'}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}