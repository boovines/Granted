// OAuth Authentication Service
import { oauthConfig } from './config'
import type { User, Session, LoginCredentials, SignUpCredentials, OAuthCallbackData } from './types'

class AuthService {
  private baseUrl: string
  private supabaseUrl: string
  private supabaseKey: string

  constructor() {
    this.baseUrl = oauthConfig.app.redirectUrl
    this.supabaseUrl = oauthConfig.supabase.url
    this.supabaseKey = oauthConfig.supabase.anonKey
  }

  // Get OAuth provider URL
  getProviderUrl(provider: 'google' | 'github'): string {
    const state = this.generateState()
    localStorage.setItem('oauth_state', state)
    
    const params = new URLSearchParams({
      client_id: oauthConfig.providers[provider].clientId,
      redirect_uri: `${this.baseUrl}${oauthConfig.app.callbackPath}`,
      response_type: 'code',
      scope: provider === 'google' ? 'openid email profile' : 'user:email',
      state: state,
    })

    const baseUrl = provider === 'google' 
      ? 'https://accounts.google.com/o/oauth2/v2/auth'
      : 'https://github.com/login/oauth/authorize'

    return `${baseUrl}?${params.toString()}`
  }

  // Handle OAuth callback
  async handleCallback(data: OAuthCallbackData): Promise<Session> {
    const storedState = localStorage.getItem('oauth_state')
    if (storedState !== data.state) {
      throw new Error('Invalid state parameter')
    }

    localStorage.removeItem('oauth_state')

    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(data.code, data.provider)
    
    // Get user info from provider
    const userInfo = await this.getUserInfo(tokens.access_token, data.provider)
    
    // Create or update user in Supabase
    const user = await this.createOrUpdateUser(userInfo, data.provider)
    
    // Create session
    const session: Session = {
      user,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
    }

    this.setSession(session)
    return session
  }

  // Credentials login
  async loginWithCredentials(credentials: LoginCredentials): Promise<Session> {
    // For frontend-only OAuth, this would need a backend
    // For now, throw an error to indicate OAuth is required
    throw new Error('Credentials login requires a backend. Please use OAuth providers.')
  }

  // Sign up with credentials
  async signUpWithCredentials(credentials: SignUpCredentials): Promise<Session> {
    // For frontend-only OAuth, this would need a backend
    // For now, throw an error to indicate OAuth is required
    throw new Error('Sign up requires a backend. Please use OAuth providers.')
  }

  // Sign out
  async signOut(): Promise<void> {
    this.clearSession()
    // For frontend-only OAuth, just clear the local session
  }

  // Get current session
  getSession(): Session | null {
    const stored = localStorage.getItem('auth_session')
    if (!stored) return null

    try {
      const session = JSON.parse(stored)
      if (session.expiresAt < Date.now()) {
        this.clearSession()
        return null
      }
      return session
    } catch {
      this.clearSession()
      return null
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    const session = this.getSession()
    return session?.user || null
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getSession() !== null
  }

  // Private methods
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }

  private async exchangeCodeForTokens(code: string, provider: string): Promise<any> {
    // For frontend-only OAuth, we'll simulate the token exchange
    // In a real app, you'd make this request to your backend
    const redirectUri = `${this.baseUrl}${oauthConfig.app.callbackPath}`
    
    if (provider === 'google') {
      // For Google OAuth, we need to exchange the code for tokens
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: oauthConfig.providers.google.clientId,
          client_secret: oauthConfig.providers.google.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to exchange code for tokens')
      }

      return response.json()
    } else {
      // For GitHub OAuth
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          client_id: oauthConfig.providers.github.clientId,
          client_secret: oauthConfig.providers.github.clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to exchange code for tokens')
      }

      return response.json()
    }
  }

  private async getUserInfo(accessToken: string, provider: string): Promise<any> {
    const url = provider === 'google' 
      ? 'https://www.googleapis.com/oauth2/v2/userinfo'
      : 'https://api.github.com/user'

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get user info')
    }

    return response.json()
  }

  private async createOrUpdateUser(userInfo: any, provider: string): Promise<User> {
    // For frontend-only OAuth, create user object directly
    const user: User = {
      id: userInfo.id || userInfo.sub || Date.now().toString(),
      email: userInfo.email,
      name: userInfo.name || userInfo.login,
      avatar: userInfo.picture || userInfo.avatar_url,
      provider,
    }

    return user
  }

  private async getUser(userId: string): Promise<User> {
    // For frontend-only OAuth, return a mock user
    // In a real app, you'd fetch from your backend
    return {
      id: userId,
      email: 'user@example.com',
      name: 'User',
      avatar: '',
      provider: 'google',
    }
  }

  private setSession(session: Session): void {
    localStorage.setItem('auth_session', JSON.stringify(session))
  }

  private clearSession(): void {
    localStorage.removeItem('auth_session')
  }
}

export const authService = new AuthService()