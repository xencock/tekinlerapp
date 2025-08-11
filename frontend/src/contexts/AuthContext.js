import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Sayfa yüklendiğinde kullanıcı durumunu kontrol et
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await authAPI.getMe();
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setIsAuthenticated(true);
      
      toast.success('🎉 Hoş geldiniz! Giriş başarılı', { duration: 3000 });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Giriş yapılamadı';
      toast.error(`❌ ${message}`, { duration: 4000 });
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { user } = response.data;
      
      toast.success('✅ Kullanıcı hesabı başarıyla oluşturuldu!', { duration: 3000 });
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Kayıt yapılamadı';
      toast.error(`⚠️ ${message}`, { duration: 4000 });
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      toast.success('👋 Güle güle! Çıkış yapıldı', { duration: 2500 });
    }
  };

  const changePin = async (pinData) => {
    try {
      await authAPI.changePin(pinData);
      toast.success('🔐 PIN kodunuz başarıyla değiştirildi', { duration: 3000 });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'PIN değiştirilemedi';
      toast.error(`❌ ${message}`, { duration: 4000 });
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    changePin,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 