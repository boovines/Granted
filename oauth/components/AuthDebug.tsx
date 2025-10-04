// Auth Debug Component (for development)
import React from 'react'
import { useAuth } from '../hooks/useAuth'

export function AuthDebug() {
  const { user, session, isLoading, isAuthenticated, refreshAuth } = useAuth()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h4 className="font-bold mb-2">Auth Debug</h4>
      <div className="space-y-1">
        <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
        <div>User: {user ? user.name : 'None'}</div>
        <div>Session: {session ? 'Active' : 'None'}</div>
        <div>LocalStorage: {localStorage.getItem('auth_session') ? 'Has data' : 'Empty'}</div>
      </div>
      <button
        onClick={refreshAuth}
        className="mt-2 px-2 py-1 bg-blue-600 text-white rounded text-xs"
      >
        Refresh Auth
      </button>
    </div>
  )
}

export default AuthDebug
