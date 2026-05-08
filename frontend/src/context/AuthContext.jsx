import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('learnavo_user');
    const storedToken = localStorage.getItem('learnavo_token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('learnavo_user');
        localStorage.removeItem('learnavo_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { token, user: userData } = await authApi.login(email, password);
      localStorage.setItem('learnavo_token', token);
      localStorage.setItem('learnavo_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      // Demo fallback: allow known demo accounts locally
      const demoAccounts = [
        { email: 'ananya@university.edu', password: 'learnavo123', role: 'professor', name: 'Dr. Ananya Sharma', department: 'Computer Science' },
        { email: 'priya@university.edu', password: 'learnavo123', role: 'hod', name: 'Dr. Priya Menon', department: 'Computer Science' },
        { email: 'arjun@student.edu', password: 'learnavo123', role: 'student', name: 'Arjun Patel' },
      ];
      const demo = demoAccounts.find(a => a.email === email && a.password === password);
      if (demo) {
        const userData = { id: Math.random(), email: demo.email, name: demo.name, role: demo.role, department: demo.department };
        localStorage.setItem('learnavo_token', 'demo-token');
        localStorage.setItem('learnavo_user', JSON.stringify(userData));
        setUser(userData);
        return userData;
      }
      throw new Error(err.response?.data?.message || err.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('learnavo_token');
    localStorage.removeItem('learnavo_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
