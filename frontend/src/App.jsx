import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveSession from './pages/LiveSession';
import SessionHistory from './pages/SessionHistory';
import SessionDetail from './pages/SessionDetail';
import AnomalyCenter from './pages/AnomalyCenter';
import HodDashboard from './pages/HodDashboard';
import Students from './pages/Students';
import Settings from './pages/Settings';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-page"><div className="spinner"></div><p>Loading...</p></div>;
  }
  
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={
          user?.role === 'hod' ? <Navigate to="/hod" replace /> : <Dashboard />
        } />
        <Route path="live-session" element={
          <ProtectedRoute roles={['professor']}><LiveSession /></ProtectedRoute>
        } />
        <Route path="sessions" element={<SessionHistory />} />
        <Route path="sessions/:id" element={<SessionDetail />} />
        <Route path="anomalies" element={<AnomalyCenter />} />
        <Route path="hod" element={
          <ProtectedRoute roles={['hod']}><HodDashboard /></ProtectedRoute>
        } />
        <Route path="students" element={<Students />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
