import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      overflow: 'hidden',
    }}>
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN AREA */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {/* TOPBAR */}
        <TopBar />

        {/* PAGE CONTENT */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '28px 28px',
          background: 'var(--bg-primary)',
        }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}