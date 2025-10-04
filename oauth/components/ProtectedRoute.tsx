import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LoginForm } from './LoginForm';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-app-white">
        Loading authentication...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <LoginForm />
      </div>
    );
  }

  return <>{children}</>;
};