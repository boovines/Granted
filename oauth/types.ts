// OAuth Types for Academic Writing IDE

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  provider: 'google' | 'github' | 'credentials'
  createdAt: string
  updatedAt: string
}

export interface Session {
  user: User
  accessToken: string
  refreshToken?: string
  expiresAt: number
}

export interface OAuthProvider {
  id: string
  name: string
  icon: string
  color: string
  enabled: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignUpCredentials {
  email: string
  password: string
  name: string
}

export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: string | null
}

export interface OAuthCallbackData {
  code: string
  state: string
  provider: string
}