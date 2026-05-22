import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Setup axios interceptor for token
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
      }
      return config;
    });

    return () => axios.interceptors.request.eject(interceptor);
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  const normalizeUser = (nextUser) => ({
    ...nextUser,
    isUnlimited: nextUser?.isUnlimited ?? nextUser?.role === 'admin'
  });

  const checkAuth = async () => {
    try {
      // Try to restore token from localStorage first
      const storedToken = localStorage.getItem('auth_token');
      
      const config = {
        withCredentials: true,
        headers: {}
      };
      
      // Add token to Authorization header if available
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      
      const response = await axios.get(`${API_URL}/auth/status`, config);
      if (response.data.authenticated && response.data.user) {
        setUser(normalizeUser(response.data.user));
        // Persist token returned by server (either cookie-originated or new)
        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token);
        }
      } else {
        setUser(null);
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, 
      { username, password },
      { withCredentials: true }
    );
    
    // Store token in localStorage for persistence
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    
    setUser(normalizeUser(response.data.user));
    return response.data;
  };

  const register = async (username, email, password) => {
    const response = await axios.post(`${API_URL}/auth/register`,
      { username, email, password },
      { withCredentials: true }
    );
    
    // Store token in localStorage for persistence
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    
    setUser(normalizeUser(response.data.user));
    return response.data;
  };

  const logout = async () => {
    await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const updateCredits = (newCredits) => {
    setUser(prev => {
      if (!prev) return prev;
      if (prev.isUnlimited) return prev;
      return { ...prev, credits: newCredits };
    });
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      updateCredits,
      refreshUser,
      API_URL 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
