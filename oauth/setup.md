# OAuth Setup Guide for Academic Writing IDE

This guide will help you set up OAuth authentication for your Academic Writing IDE using Supabase.

## 🚀 Quick Setup

### 1. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Supabase Configuration
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

### 2. Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Get your project URL and anon key** from the project settings
3. **Create a users table** in your Supabase database:

```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  provider TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

4. **Enable Row Level Security (RLS)** on the users table:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to insert their own data
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### 3. OAuth Provider Setup

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:5173/oauth/callback/google` (development)
   - `https://yourdomain.com/oauth/callback/google` (production)
7. Copy the Client ID and Client Secret

#### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Academic Writing IDE
   - **Homepage URL**: `http://localhost:5173` (development)
   - **Authorization callback URL**: `http://localhost:5173/oauth/callback/github`
4. Copy the Client ID and Client Secret

### 4. Integration with Your App

Add the OAuth components to your existing Vite app:

```tsx
// In your main App.tsx or component
import { 
  LoginButton, 
  UserProfile, 
  ProtectedRoute,
  initializeOAuth 
} from './oauth/integration/vite'

// Initialize OAuth when app starts
useEffect(() => {
  initializeOAuth()
}, [])

// Use in your components
function App() {
  return (
    <div>
      {/* Your existing app content */}
      <LoginButton />
      <UserProfile />
      
      <ProtectedRoute>
        {/* Protected content */}
      </ProtectedRoute>
    </div>
  )
}
```

## 🔧 Advanced Configuration

### Custom Styling

The OAuth components use Tailwind CSS classes. You can customize them by:

1. **Overriding CSS classes** in your global styles
2. **Using className props** to add custom styles
3. **Modifying the component source** in the `oauth/components/` folder

### Custom Redirects

Modify the redirect behavior in `oauth/config.ts`:

```typescript
export const oauthConfig = {
  app: {
    redirectUrl: process.env.VITE_APP_URL || 'http://localhost:5173',
    loginPath: '/oauth/login',
    callbackPath: '/oauth/callback',
  },
  // ... other config
}
```

### Adding More OAuth Providers

To add more OAuth providers (e.g., Microsoft, Discord):

1. **Add provider config** in `oauth/config.ts`
2. **Update the auth service** in `oauth/auth.ts`
3. **Add provider buttons** in `oauth/components/LoginForm.tsx`
4. **Update types** in `oauth/types.ts`

## 🚨 Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Check that your redirect URIs match exactly in OAuth provider settings
   - Ensure URLs use correct protocol (http vs https)

2. **"Client ID not found" error**
   - Verify environment variables are set correctly
   - Check that `.env.local` is in your project root
   - Restart your development server after adding env vars

3. **Supabase connection issues**
   - Verify your Supabase URL and anon key
   - Check that RLS policies are set up correctly
   - Ensure the users table exists

4. **CORS errors**
   - Add your domain to Supabase allowed origins
   - Check that your app URL matches the configured redirect URL

### Debug Mode

Enable debug logging by adding to your `.env.local`:

```bash
VITE_DEBUG_OAUTH=true
```

This will log OAuth flow details to the console.

## 📚 API Reference

### Hooks

- `useAuth()` - Main authentication hook
- Returns: `{ user, session, isLoading, error, isAuthenticated, login, signUp, loginWithProvider, signOut }`

### Components

- `LoginButton` - Simple login button
- `LoginForm` - Full login/signup form
- `UserProfile` - User dropdown with profile info
- `ProtectedRoute` - Route protection wrapper

### Services

- `authService` - Core authentication service
- `handleOAuthCallback()` - OAuth callback handler

## 🔒 Security Notes

- Always use HTTPS in production
- Keep your OAuth secrets secure
- Implement proper error handling
- Consider adding rate limiting
- Regularly rotate your secrets

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the Supabase documentation
3. Check OAuth provider documentation
4. Monitor application logs for errors
