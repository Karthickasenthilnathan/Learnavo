/**
 * Auth Context — JWT-based authentication for student app
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, demoApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load saved session on app start
  useEffect(() => {
    (async () => {
      try {
        const savedUser = await AsyncStorage.getItem('learnavo_user');
        const token = await AsyncStorage.getItem('learnavo_token');
        if (savedUser && token) {
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.warn('Failed to load session:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await authApi.login(email, password);
      
      if (data.user.role !== 'student') {
        throw new Error('This app is for students only');
      }

      await AsyncStorage.setItem('learnavo_token', data.accessToken);
      await AsyncStorage.setItem('learnavo_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err) {
      // Demo fallback — login without backend
      if (email.includes('@student')) {
        const demoUser = {
          id: 4,
          name: email.split('@')[0].replace(/^\w/, c => c.toUpperCase()),
          email,
          role: 'student',
          department: 'Computer Science',
          student_id: 'CS2023001',
        };
        await AsyncStorage.setItem('learnavo_token', 'demo-token');
        await AsyncStorage.setItem('learnavo_user', JSON.stringify(demoUser));
        setUser(demoUser);
        return demoUser;
      }
      throw err.response?.data?.error 
        ? new Error(err.response.data.error) 
        : err;
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['learnavo_token', 'learnavo_user']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

export default AuthContext;
