import React, { createContext, useContext, useState } from 'react';
import { useMe, type User } from '../api/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('blueprints_token'));
  const [user, setUser] = useState<User | null>(null);
  const { data: userData, isLoading } = useMe({ enabled: isAuthenticated });

  React.useEffect(() => {
    if (userData) {
      setUser(userData);
    }
  }, [userData]);

  const login = (token: string, userData: User) => {
    localStorage.setItem('blueprints_token', token);
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('blueprints_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
