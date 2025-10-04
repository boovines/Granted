// OAuth Login Page Component
import React from 'react'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  const handleSuccess = () => {
    // Redirect to main app after successful login
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Academic Writing IDE
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your writing workspace
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm onSuccess={handleSuccess} />
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
