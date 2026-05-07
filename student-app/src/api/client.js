/**
 * LearnAvo API Client — React Native
 * Connects to the Node.js backend. Uses 10.0.2.2 for Android emulator.
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to reach host machine's localhost
const BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api',
  ios: 'http://localhost:3000/api',
  default: 'http://localhost:3000/api',
});

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('learnavo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['learnavo_token', 'learnavo_user']);
    }
    return Promise.reject(error);
  }
);

/**
 * Auth API
 */
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

/**
 * Student API
 */
export const studentApi = {
  getScheduleToday: () => api.get('/student/schedule/today'),
  getAttendanceHistory: () => api.get('/student/attendance/history'),
  getProfile: () => api.get('/student/profile'),
};

/**
 * Attendance API
 */
export const attendanceApi = {
  generateToken: (data) => api.post('/attendance/generate-token', data),
  verifyScan: (data) => api.post('/attendance/verify-scan', data),
  broadcast: (data) => api.post('/attendance/broadcast', data),
};

/**
 * Demo API (fallback when DB isn't running)
 */
export const demoApi = {
  getScheduleToday: () => api.get('/demo/student/schedule/today'),
  getAttendanceHistory: () => api.get('/demo/student/attendance/history'),
  getProfile: () => api.get('/demo/student/profile'),
};

export default api;
