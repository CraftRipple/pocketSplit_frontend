import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import * as api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: Partial<User> | null;
  loading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  register: (data: { username: string; email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Partial<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for token on mount
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = jwtDecode<{ user_id: number; username: string; exp: number }>(token);
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          handleLogout();
        } else {
          setUser({ id: decoded.user_id, username: decoded.username });
        }
      } catch (error) {
        handleLogout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: { username: string; password: string }): Promise<boolean> => {
    try {
      const response = await api.login(credentials);
      const { access } = response.data;
      localStorage.setItem('access_token', access);
      const decoded = jwtDecode<{ user_id: number; username: string }>(access);
      setUser({ id: decoded.user_id, username: decoded.username });
      
      // Get the redirect path from location state or default to dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (data: { username: string; email: string; password: string }): Promise<boolean> => {
    try {
      const response = await api.register(data);
      const { access } = response.data;
      localStorage.setItem('access_token', access);
      const decoded = jwtDecode<{ user_id: number; username: string }>(access);
      setUser({ id: decoded.user_id, username: decoded.username });
      navigate('/dashboard', { replace: true });
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      setUser(null);
      navigate('/login', { replace: true });
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 