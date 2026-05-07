import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Settings() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your profile and system configuration</p>
      </div>

      <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Profile */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 20 }}>👤 Profile</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--emerald-500), var(--emerald-700))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 700, color: 'white',
            }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{user?.email}</div>
              <span className={`badge ${user?.role === 'hod' ? 'badge-active' : 'badge-verified'}`} style={{ marginTop: 4 }}>
                {user?.role?.toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Name</label>
              <input type="text" defaultValue={user?.name || ''} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</label>
              <input type="email" defaultValue={user?.email || ''} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Department</label>
              <input type="text" defaultValue={user?.department || 'Computer Science'} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Role</label>
              <input type="text" defaultValue={user?.role || ''} disabled style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed' }} />
            </div>
          </div>
        </div>

        {/* Verification Settings */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 20 }}>🔐 Verification Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>QR Rotation Interval</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>How often the dynamic QR code refreshes</div>
              </div>
              <select defaultValue="30" style={{ width: 120, textAlign: 'center' }}>
                <option value="15">15 seconds</option>
                <option value="30">30 seconds</option>
                <option value="45">45 seconds</option>
                <option value="60">60 seconds</option>
              </select>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>BLE RSSI Threshold</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Minimum signal strength for proximity verification</div>
              </div>
              <select defaultValue="-75" style={{ width: 120, textAlign: 'center' }}>
                <option value="-65">-65 dBm (strict)</option>
                <option value="-70">-70 dBm</option>
                <option value="-75">-75 dBm (default)</option>
                <option value="-80">-80 dBm (lenient)</option>
              </select>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Anomaly Detection</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Enable real-time Layer 1 anomaly detection</div>
              </div>
              <div style={{
                width: 48, height: 26, borderRadius: 13, background: 'var(--emerald-500)',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: 'white',
                  position: 'absolute', top: 3, right: 3, transition: 'right 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Cluster Sync Threshold</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Students scanning in same time window to trigger alert</div>
              </div>
              <select defaultValue="5" style={{ width: 120, textAlign: 'center' }}>
                <option value="3">3 students</option>
                <option value="5">5 students</option>
                <option value="8">8 students</option>
                <option value="10">10 students</option>
              </select>
            </div>
          </div>
        </div>

        {/* Beacon Configuration */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 20 }}>📶 Beacon Configuration</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { name: 'CS Lab 101', mac: 'AA:BB:CC:01:01:01', status: 'active', calibrated: '5 days ago' },
              { name: 'Lecture Hall B', mac: 'AA:BB:CC:02:02:02', status: 'active', calibrated: '10 days ago' },
              { name: 'Seminar Room C', mac: 'AA:BB:CC:03:03:03', status: 'active', calibrated: '2 days ago' },
            ].map((beacon, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 'var(--radius-md)',
                background: 'var(--surface-1)', border: '1px solid var(--border-subtle)',
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: beacon.status === 'active' ? 'var(--verified)' : 'var(--rejected)',
                  boxShadow: beacon.status === 'active' ? '0 0 8px var(--verified)' : 'none',
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{beacon.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{beacon.mac}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge badge-${beacon.status === 'active' ? 'verified' : 'rejected'}`}>
                    {beacon.status}
                  </span>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Calibrated {beacon.calibrated}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save button */}
        <button className="btn btn-primary" onClick={handleSave} style={{ alignSelf: 'flex-end', padding: '12px 32px' }}>
          {saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
