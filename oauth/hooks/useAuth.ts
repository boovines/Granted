// OAuth Authentication Hook
import { useState, useEffect, useCallback } from 'react'
import { authService } from '../auth'
import type { User, Session, LoginCredentials, SignUpCredentials } from '../types'

export interface UseAuthReturn {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  signUp: (credentials: SignUpCredentials) => Promise<void>
  loginWithProvider: (provider: 'google' | 'github') => void
  signOut: () => Promise<void>
  clearError: () => void
  refreshAuth: () => void
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize auth state
  useEffect(() => {
    const initAuth = () => {
      try {
        const currentSession = authService.getSession()
        const currentUser = authService.getCurrentUser()
        
        console.log('Auth initialization:', { currentSession, currentUser })
        
        setSession(currentSession)
        setUser(currentUser)
      } catch (err) {
        console.error('Auth initialization error:', err)
        setError('Failed to initialize authentication')
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
    
    // Listen for storage changes (when OAuth callback completes)
    const handleStorageChange = () => {
      const currentSession = authService.getSession()
      const currentUser = authService.getCurrentUser()
      console.log('Storage change detected:', { currentSession, currentUser })
      setSession(currentSession)
      setUser(currentUser)
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also check for auth changes on focus (when returning from OAuth)
    const handleFocus = () => {
      const currentSession = authService.getSession()
      const currentUser = authService.getCurrentUser()
      if (currentSession !== session || currentUser !== user) {
        console.log('Focus change detected:', { currentSession, currentUser })
        setSession(currentSession)
        setUser(currentUser)
      }
    }
    
    // Listen for OAuth completion event
    const handleOAuthComplete = () => {
      console.log('OAuth complete event received')
      const currentSession = authService.getSession()
      const currentUser = authService.getCurrentUser()
      console.log('OAuth complete - auth state:', { currentSession, currentUser })
      setSession(currentSession)
      setUser(currentUser)
    }
    
    window.addEventListener('focus', handleFocus)
    window.addEventListener('oauth-complete', handleOAuthComplete)
    
    // Periodic check for auth state changes (fallback)
    const authCheckInterval = setInterval(() => {
      const currentSession = authService.getSession()
      const currentUser = authService.getCurrentUser()
      if (currentSession !== session || currentUser !== user) {
        console.log('Periodic auth check - state changed:', { currentSession, currentUser })
        setSession(currentSession)
        setUser(currentUser)
      }
    }, 1000) // Check every second
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('oauth-complete', handleOAuthComplete)
      clearInterval(authCheckInterval)
    }
  }, [session, user])

  // Login with credentials
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const newSession = await authService.loginWithCredentials(credentials)
      setSession(newSession)
      setUser(newSession.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Sign up with credentials
  const signUp = useCallback(async (credentials: SignUpCredentials) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const newSession = await authService.signUpWithCredentials(credentials)
      setSession(newSession)
      setUser(newSession.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Login with OAuth provider
  const loginWithProvider = useCallback((provider: 'google' | 'github') => {
    try {
      const url = authService.getProviderUrl(provider)
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth login failed')
    }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await authService.signOut()
      setSession(null)
      setUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Refresh auth state (useful after OAuth callback)
  const refreshAuth = useCallback(() => {
    try {
      const currentSession = authService.getSession()
      const currentUser = authService.getCurrentUser()
      console.log('Manual auth refresh:', { currentSession, currentUser })
      setSession(currentSession)
      setUser(currentUser)
    } catch (err) {
      console.error('Auth refresh error:', err)
      setError('Failed to refresh authentication')
    }
  }, [])

  return {
    user,
    session,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    signUp,
    loginWithProvider,
    signOut,
    clearError,
    refreshAuth,
  }
}