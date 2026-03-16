import { useState, useEffect, createContext, useContext } from 'react';
import { authService } from '@/services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authService.getMe();
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    console.log('Login called with:', email);
    try {
      const response = await authService.login({ email, password });
      console.log('Auth service response:', response);
      localStorage.setItem('token', response.token);
      setUser(response.data);
      return response;
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    localStorage.setItem('token', response.token);
    setUser(response.data);
    return response;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const updateUser = async (userData) => {
    const response = await authService.updateDetails(userData);
    setUser(response.data);
    return response;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;