import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/status`, {
        withCredentials: true
      });
      if (response.data.authenticated) {
        const userInfo = await axios.get(`${API_URL}/user/info`, {
          withCredentials: true
        });
        setUser(userInfo.data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, 
      { username, password },
      { withCredentials: true }
    );
    setUser(response.data.user);
    return response.data;
  };

  const register = async (username, email, password) => {
    const response = await axios.post(`${API_URL}/auth/register`,
      { username, email, password },
      { withCredentials: true }
    );
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    setUser(null);
  };

  const updateCredits = (newCredits) => {
    setUser(prev => ({ ...prev, credits: newCredits }));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      updateCredits,
      API_URL 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
