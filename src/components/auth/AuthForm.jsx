import { useState } from 'react';
import { typography, colors } from '../../styles/index.js';
import { supabaseHelpers } from '../../lib/supabase.js';
import Button from '../common/Button.jsx';

function AuthForm({ onSuccess }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    console.log(`[AuthForm] ${mode === 'signin' ? 'Sign in' : 'Sign up'} attempt:`, email);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabaseHelpers.signUp(email, password, {
          full_name: fullName,
        });

        if (error) throw error;

        console.log('[AuthForm] Sign up successful');
        setMessage('Account created! Please check your email to verify your account.');
        setTimeout(() => {
          setMode('signin');
          setMessage(null);
        }, 3000);
      } else {
        const { data, error } = await supabaseHelpers.signIn(email, password);

        if (error) throw error;

        console.log('[AuthForm] Sign in successful');
        if (onSuccess) onSuccess(data.user);
      }
    } catch (err) {
      console.error('[AuthForm] Error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      maxWidth: '400px',
      margin: '0 auto',
      padding: '20px',
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    title: {
      ...typography.h2,
      color: colors.neutral[900],
      marginBottom: '24px',
      textAlign: 'center',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    label: {
      ...typography.label,
      color: colors.neutral[700],
    },
    input: {
      ...typography.input,
      padding: '12px 16px',
      borderRadius: '8px',
      border: `1px solid ${colors.neutral[300]}`,
      outline: 'none',
      transition: 'border-color 0.2s',
    },
    buttonGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginTop: '8px',
    },
    toggleButton: {
      ...typography.bodySmall,
      color: colors.primary[600],
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      textAlign: 'center',
      textDecoration: 'underline',
      padding: '8px',
    },
    error: {
      ...typography.bodySmall,
      color: colors.danger[600],
      backgroundColor: colors.danger[50],
      padding: '12px',
      borderRadius: '8px',
    },
    message: {
      ...typography.bodySmall,
      color: colors.success[700],
      backgroundColor: colors.success[50],
      padding: '12px',
      borderRadius: '8px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h2>

        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.message}>{message}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'signup' && (
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={styles.input}
                required
                disabled={loading}
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
              disabled={loading}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={6}
            />
          </div>

          <div style={styles.buttonGroup}>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>

            <button
              type="button"
              style={styles.toggleButton}
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
                setMessage(null);
              }}
              disabled={loading}
            >
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AuthForm;
