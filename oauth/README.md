# OAuth Implementation for Academic Writing IDE

A complete OAuth authentication system designed for your Academic Writing IDE, built to work with your existing Vite + React setup and Supabase backend.

## 🎯 Features

- ✅ **Google OAuth** - Sign in with Google accounts
- ✅ **GitHub OAuth** - Sign in with GitHub accounts  
- ✅ **Credentials Authentication** - Email/password login
- ✅ **User Registration** - Sign up with email/password
- ✅ **Session Management** - Secure JWT-based sessions
- ✅ **Protected Routes** - Automatic authentication checks
- ✅ **User Profile** - Avatar dropdown with user info
- ✅ **Responsive Design** - Works on all devices
- ✅ **TypeScript Support** - Full type safety
- ✅ **Supabase Integration** - Works with your existing Supabase setup
- ✅ **No Vercel/Netlify Required** - Uses environment variables

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# OAuth Providers (Optional)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret
VITE_GITHUB_CLIENT_ID=your-github-client-id
VITE_GITHUB_CLIENT_SECRET=your-github-client-secret

# App Configuration
VITE_APP_URL=http://localhost:5173
```

### 2. Add to Your App

```tsx
// In your main App.tsx
import { 
  LoginButton, 
  UserProfile, 
  ProtectedRoute,
  initializeOAuth 
} from './oauth/integration/vite'
import { useEffect } from 'react'

function App() {
  useEffect(() => {
    initializeOAuth()
  }, [])

  return (
    <div>
      <header>
        <h1>Academic Writing IDE</h1>
        <LoginButton />
        <UserProfile />
      </header>
      
      <ProtectedRoute>
        {/* Your protected content */}
      </ProtectedRoute>
    </div>
  )
}
```

## 📁 File Structure

```
oauth/
├── components/
│   ├── LoginButton.tsx          # Simple login button
│   ├── LoginForm.tsx            # Full login/signup form
│   ├── UserProfile.tsx          # User dropdown menu
│   └── ProtectedRoute.tsx       # Route protection wrapper
├── hooks/
│   └── useAuth.ts               # Authentication hook
├── utils/
│   └── callback.ts              # OAuth callback utilities
├── integration/
│   └── vite.ts                  # Vite integration exports
├── config.ts                    # OAuth configuration
├── auth.ts                      # Authentication service
├── types.ts                     # TypeScript definitions
└── README.md                    # This file
```

## 🔧 Usage Examples

### Basic Login Button

```tsx
import { LoginButton } from './oauth/integration/vite'

function Header() {
  return (
    <header>
      <h1>Academic Writing IDE</h1>
      <LoginButton />
    </header>
  )
}
```

### Protected Content

```tsx
import { ProtectedRoute } from './oauth/integration/vite'

function App() {
  return (
    <div>
      <ProtectedRoute>
        <Workspace />
        <Editor />
        <Documents />
      </ProtectedRoute>
    </div>
  )
}
```

### User Profile

```tsx
import { UserProfile } from './oauth/integration/vite'

function Navigation() {
  return (
    <nav>
      <UserProfile />
    </nav>
  )
}
```

### Custom Authentication Logic

```tsx
import { useAuth } from './oauth/integration/vite'

function MyComponent() {
  const { user, isAuthenticated, login, signOut } = useAuth()

  if (!isAuthenticated) {
    return <div>Please sign in to continue</div>
  }

  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

## 🛠️ Configuration

### OAuth Providers

The system supports multiple OAuth providers. Configure them in your environment variables:

```bash
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth  
VITE_GITHUB_CLIENT_ID=your-github-client-id
VITE_GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Supabase Setup

1. **Create a users table** in your Supabase database
2. **Set up Row Level Security (RLS)** policies
3. **Configure OAuth providers** in Supabase Auth settings

## 🎨 Customization

### Styling

All components use Tailwind CSS classes and can be customized:

```tsx
<LoginButton 
  className="bg-purple-600 hover:bg-purple-700"
  variant="primary"
  size="lg"
>
  Custom Login Text
</LoginButton>
```

### Custom Redirects

Modify redirect behavior in `config.ts`:

```typescript
export const oauthConfig = {
  app: {
    redirectUrl: 'https://yourdomain.com',
    loginPath: '/auth/login',
    callbackPath: '/auth/callback',
  }
}
```

## 🔒 Security Features

- **JWT-based sessions** with configurable expiration
- **Secure token storage** in localStorage
- **CSRF protection** with state parameters
- **Automatic token refresh** when needed
- **Secure OAuth flows** following best practices

## 📚 API Reference

### useAuth Hook

```typescript
const {
  user,              // Current user object
  session,           // Current session object
  isLoading,         // Loading state
  error,            // Error message
  isAuthenticated,   // Authentication status
  login,            // Login function
  signUp,           // Sign up function
  loginWithProvider, // OAuth login
  signOut,          // Sign out function
  clearError        // Clear error function
} = useAuth()
```

### Components

- **LoginButton** - Simple login button with loading states
- **LoginForm** - Complete login/signup form with OAuth providers
- **UserProfile** - User dropdown with profile info and sign out
- **ProtectedRoute** - Wrapper for protected content

## 🚨 Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Ensure `.env.local` is in project root
   - Restart development server
   - Check variable names start with `VITE_`

2. **OAuth redirect errors**
   - Verify redirect URIs in OAuth provider settings
   - Check that URLs match exactly (http vs https)

3. **Supabase connection issues**
   - Verify Supabase URL and anon key
   - Check RLS policies are configured
   - Ensure users table exists

### Debug Mode

Enable debug logging:

```bash
VITE_DEBUG_OAUTH=true
```

## 📞 Support

For detailed setup instructions, see the setup guide.

For issues:
1. Check the troubleshooting section
2. Review Supabase documentation
3. Check OAuth provider documentation
4. Monitor browser console for errors

## 🔄 Updates

This OAuth implementation is designed to be:
- **Framework agnostic** - Works with any React setup
- **Provider extensible** - Easy to add new OAuth providers
- **Configurable** - Customize behavior without code changes
- **Secure** - Follows OAuth 2.0 best practices