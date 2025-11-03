import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from AsyncStorage on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load auth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      const { token: newToken, ...userData } = response.data;

      // Save to AsyncStorage
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      const response = await authService.register(data);
      const { token: newToken, ...userData } = response.data;

      // Save to AsyncStorage
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');

      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
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
