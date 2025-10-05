// OAuth Callback Handler
import { authService } from '../auth'
import type { OAuthCallbackData } from '../types'

export function handleOAuthCallback(): Promise<void> {
  return new Promise((resolve, reject) => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    const error = urlParams.get('error')

    if (error) {
      reject(new Error(`OAuth error: ${error}`))
      return
    }

    if (!code || !state) {
      reject(new Error('Missing OAuth parameters'))
      return
    }

    // Determine provider from URL or state
    const provider = window.location.pathname.includes('github') ? 'github' : 'google'
    
    const callbackData: OAuthCallbackData = {
      code,
      state,
      provider,
    }

    authService.handleCallback(callbackData)
      .then((session) => {
        // Session is now stored in localStorage by authService
        // Don't redirect here - let App.tsx handle the OAuth parameters
        resolve()
      })
      .catch(reject)
  })
}

export function getCallbackUrl(provider: 'google' | 'github'): string {
  const baseUrl = window.location.origin
  return `${baseUrl}/oauth/callback/${provider}`
}