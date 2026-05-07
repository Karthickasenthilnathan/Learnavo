import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'hod' ? '/hod' : '/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (email) => {
    setEmail(email);
    setPassword('learnavo123');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '10%', left: '15%', width: 400, height: 400,
          borderRadius: '50%', background: 'rgba(16,185,129,0.04)', filter: 'blur(100px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '15%', width: 500, height: 500,
          borderRadius: '50%', background: 'rgba(59,130,246,0.03)', filter: 'blur(120px)',
        }} />
        {/* Grid lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="animate-fade-in" style={{
        width: '100%', maxWidth: 440, padding: '0 20px', position: 'relative', zIndex: 1,
      }}>
        {/* Logo and branding */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--emerald-500), var(--emerald-700))',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 800, color: 'white',
            boxShadow: 'var(--shadow-glow-strong)', marginBottom: 16,
          }}>
            L
          </div>
          <h1 style={{
            fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)',
            letterSpacing: '-0.03em', marginBottom: 4,
          }}>
            LearnAvo
          </h1>
          <p style={{
            fontSize: '0.85rem', color: 'var(--emerald-400)', fontWeight: 500,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Intelligent Attendance Integrity System
          </p>
        </div>

        {/* Login card */}
        <div className="glass-card" style={{ padding: '36px 32px' }}>
          <h2 style={{
            fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4,
          }}>Welcome back</h2>
          <p style={{
            fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 28,
          }}>Sign in to your dashboard</p>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              background: 'var(--rejected-bg)', color: 'var(--rejected)',
              fontSize: '0.85rem', marginBottom: 20, border: '1px solid rgba(239,68,68,0.2)',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} id="login-form">
            <div style={{ marginBottom: 18 }}>
              <label style={{
                display: 'block', fontSize: '0.8rem', fontWeight: 600,
                color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@university.edu"
                required
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', fontSize: '0.8rem', fontWeight: 600,
                color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%' }}
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</>
              ) : 'Sign In →'}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="glass-card" style={{
          marginTop: 16, padding: '20px 24px',
        }}>
          <div style={{
            fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12,
          }}>
            Quick Demo Login
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Professor', email: 'ananya@university.edu', icon: '👩‍🏫' },
              { label: 'HOD', email: 'priya@university.edu', icon: '🏛️' },
              { label: 'Student', email: 'arjun@student.edu', icon: '🎓' },
            ].map(demo => (
              <button
                key={demo.email}
                onClick={() => demoLogin(demo.email)}
                className="btn btn-secondary"
                style={{
                  width: '100%', justifyContent: 'flex-start', padding: '10px 14px',
                  fontSize: '0.82rem',
                }}
              >
                <span>{demo.icon}</span>
                <span>{demo.label}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {demo.email}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center', marginTop: 24, fontSize: '0.75rem', color: 'var(--text-muted)',
        }}>
          Attendance you can prove. Integrity you can measure.
        </p>
      </div>
    </div>
  );
}
