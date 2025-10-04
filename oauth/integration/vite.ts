// Vite Integration for OAuth
import { authService } from '../auth'
import { handleOAuthCallback } from '../utils/callback'

// Initialize OAuth for Vite app
export function initializeOAuth() {
  // Handle OAuth callback if we're on a callback page or have OAuth parameters
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const state = urlParams.get('state')
  
  if (window.location.pathname.startsWith('/oauth/callback') || (code && state)) {
    console.log('OAuth callback detected, handling...')
    handleOAuthCallback()
      .then(() => {
        console.log('OAuth callback handled successfully')
        // Clear URL parameters and redirect to main app
        window.history.replaceState({}, document.title, '/')
        // Trigger a custom event to notify components of auth state change
        window.dispatchEvent(new CustomEvent('oauth-complete'))
      })
      .catch((error) => {
        console.error('OAuth callback error:', error)
        // Redirect to main app with error
        window.location.href = '/?error=' + encodeURIComponent(error.message)
      })
  }
}

// Export auth service for use in components
export { authService }

// Export hooks and components
export { useAuth } from '../hooks/useAuth'
export { LoginButton } from '../components/LoginButton'
export { LoginForm } from '../components/LoginForm'
export { UserProfile } from '../components/UserProfile'
export { ProtectedRoute } from '../components/ProtectedRoute'
// Export types
export type { User, Session, LoginCredentials, SignUpCredentials } from '../types'
