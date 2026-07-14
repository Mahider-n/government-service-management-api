import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, getAccessToken, clearTokens, setTokens } from '../services/api';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone_number?: string;
  address?: string;
  profile_picture?: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: FormData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (token: string) => {
    const payload = parseJwt(token);
    if (!payload || !payload.user_id) {
      throw new Error('Invalid authentication token');
    }
    const profile = await apiRequest(`/auth/users/${payload.user_id}/`);
    setUser(profile);
  };

  const refreshUser = async () => {
    const token = getAccessToken();
    if (token) {
      try {
        await fetchUserProfile(token);
      } catch (err) {
        console.error('Failed to sync profile:', err);
        logout();
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          await fetchUserProfile(token);
        } catch (err) {
          console.error('Auth initialization failed:', err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const data = await apiRequest('/auth/login/', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ username, password }),
      });
      setTokens(data.access, data.refresh);
      await fetchUserProfile(data.access);
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData: FormData) => {
    setLoading(true);
    try {
      await apiRequest('/auth/register/', {
        method: 'POST',
        skipAuth: true,
        body: formData, // FormData contains fields like username, email, password, full_name, profile_picture
      });
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
