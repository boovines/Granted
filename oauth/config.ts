// OAuth Configuration for Academic Writing IDE
export const oauthConfig = {
  // Supabase Configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  
  // OAuth Providers
  providers: {
    google: {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
    },
    github: {
      clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_GITHUB_CLIENT_SECRET || '',
    },
  },
  
  // App Configuration
  app: {
    name: 'Academic Writing IDE',
    redirectUrl: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
    loginPath: '/oauth/login',
    callbackPath: '/oauth/callback',
  },
  
  // Session Configuration
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    secure: import.meta.env.PROD,
  }
}

export type OAuthConfig = typeof oauthConfig