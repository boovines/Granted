// OAuth Login Button Component
import React from 'react'
import { useAuth } from '../hooks/useAuth'

interface LoginButtonProps {
  className?: string
  children?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export function LoginButton({ 
  className = '', 
  children = 'Sign In',
  variant = 'primary',
  size = 'md'
}: LoginButtonProps) {
  const { loginWithProvider, isLoading, isAuthenticated } = useAuth()

  // Show loading state while checking authentication
  if (isLoading && !isAuthenticated) {
    return (
      <div className={`inline-flex items-center justify-center font-medium rounded-md transition-colors ${className}`}>
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Checking...
        </div>
      </div>
    )
  }

  // Don't render the login button if user is already authenticated
  if (isAuthenticated) {
    return null
  }

  const handleLogin = () => {
    // For now, redirect to Google OAuth
    // You can modify this to show a provider selection modal
    loginWithProvider('google')
  }

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  
  const variantClasses = {
    primary: 'bg-app-gold text-app-navy hover:bg-app-gold/90 focus:ring-app-gold',
    secondary: 'bg-app-sand text-app-navy hover:bg-app-sand/90 focus:ring-app-sand',
    outline: 'border border-app-gold text-app-gold hover:bg-app-gold/10 focus:ring-app-gold'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} animate-in fade-in duration-300 ${className}`}
    >
      {isLoading ? (
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Signing in...
        </div>
      ) : (
        children
      )}
    </button>
  )
}