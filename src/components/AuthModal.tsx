import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types/hotel';

interface AuthModalProps {
  onBypassDemo: (role: UserRole) => void;
  onAuthSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onBypassDemo, onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setMessage({ text: 'Supabase client is not configured. Use Development Demo Mode below.', error: true });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ text: 'Sign up successful! Please check your email for verification.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage({ text: 'Signed in successfully!' });
        onAuthSuccess();
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Authentication error', error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2>🏨 HotelOS Authentication</h2>
          <p style={styles.subtitle}>Secure Multi-Tenant Hotel Management System</p>
        </div>

        {supabase ? (
          <form onSubmit={handleAuth} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@hotel.com"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
              />
            </div>

            {message && (
              <div style={{ ...styles.message, background: message.error ? '#fff1f0' : '#edfdf4', color: message.error ? '#b42318' : '#027a48' }}>
                {message.text}
              </div>
            )}

            <button type="submit" disabled={loading} style={styles.primaryButton}>
              {loading ? 'Processing...' : isSignUp ? 'Create Staff Account' : 'Sign In with Supabase'}
            </button>

            <div style={styles.toggleRow}>
              <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
              <button type="button" onClick={() => setIsSignUp(!isSignUp)} style={styles.textButton}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </form>
        ) : (
          <div style={styles.warningBox}>
            <p><strong>Supabase Not Connected:</strong> Environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing. Production auth is inactive.</p>
          </div>
        )}

        <div style={styles.divider}>
          <span>[DEV MODE] SELECT TEST ROLE</span>
        </div>

        <div style={styles.demoRoles}>
          <button onClick={() => onBypassDemo('owner')} style={styles.demoButton}>👑 Owner</button>
          <button onClick={() => onBypassDemo('manager')} style={styles.demoButton}>📊 Manager</button>
          <button onClick={() => onBypassDemo('receptionist')} style={styles.demoButton}>📅 Receptionist</button>
          <button onClick={() => onBypassDemo('cashier')} style={styles.demoButton}>💳 Cashier</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: 'white',
    borderRadius: '20px',
    padding: '36px',
    width: '100%',
    maxWidth: '460px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  subtitle: {
    color: '#64748b',
    fontSize: '14px',
    marginTop: '6px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '18px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
  },
  input: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '15px',
    outline: 'none',
  },
  primaryButton: {
    background: '#1e293b',
    color: 'white',
    padding: '12px',
    borderRadius: '10px',
    border: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '15px',
    marginTop: '6px',
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#64748b',
  },
  textButton: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontWeight: 600,
    cursor: 'pointer',
  },
  warningBox: {
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '10px',
    padding: '14px',
    fontSize: '13px',
    color: '#b45309',
    marginBottom: '18px',
    textAlign: 'center' as const,
  },
  message: {
    padding: '12px',
    borderRadius: '10px',
    fontSize: '14px',
    textAlign: 'center' as const,
  },
  divider: {
    margin: '24px 0 16px',
    textAlign: 'center' as const,
    position: 'relative' as const,
    borderBottom: '1px solid #e2e8f0',
    lineHeight: '0.1em',
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: 700,
  },
  demoRoles: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  demoButton: {
    padding: '10px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    color: '#334155',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
};
