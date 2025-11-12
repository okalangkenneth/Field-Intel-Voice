import { useNavigate } from 'react-router-dom';
import { typography, colors } from '../styles/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import AuthForm from '../components/auth/AuthForm.jsx';
import { supabaseHelpers } from '../lib/supabase.js';

function Home() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.primary[100]} 100%)`,
    },
    logo: {
      ...typography.display,
      color: colors.primary[700],
      marginBottom: '16px',
      textAlign: 'center',
    },
    tagline: {
      ...typography.bodyLarge,
      color: colors.neutral[600],
      marginBottom: '48px',
      textAlign: 'center',
      maxWidth: '400px',
    },
    buttonContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      width: '100%',
      maxWidth: '300px',
    },
    button: {
      ...typography.button,
      padding: '16px 32px',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      textAlign: 'center',
    },
    primaryButton: {
      backgroundColor: colors.primary[600],
      color: colors.white,
    },
    secondaryButton: {
      backgroundColor: colors.white,
      color: colors.primary[600],
      border: `2px solid ${colors.primary[200]}`,
    },
    feature: {
      marginTop: '48px',
      textAlign: 'center',
      maxWidth: '400px',
    },
    featureTitle: {
      ...typography.h3,
      color: colors.neutral[800],
      marginBottom: '12px',
    },
    featureText: {
      ...typography.bodySmall,
      color: colors.neutral[600],
    },
  };

  const handleStartRecording = () => {
    console.log('[Home] Navigate to record page');
    navigate('/record');
  };

  const handleViewHistory = () => {
    console.log('[Home] Navigate to history page');
    navigate('/history');
  };

  const handleViewDashboard = () => {
    console.log('[Home] Navigate to dashboard page');
    navigate('/dashboard');
  };

  const handleSettings = () => {
    console.log('[Home] Navigate to settings page');
    navigate('/settings');
  };

  const handleSignOut = async () => {
    console.log('[Home] Signing out');
    await supabaseHelpers.signOut();
    window.location.reload();
  };

  const handleAuthSuccess = (user) => {
    console.log('[Home] Auth successful:', user.id);
    // User state will update automatically via AuthContext
  };

  // Show loading state
  if (loading) {
    return (
      <div style={{ ...styles.container, justifyContent: 'center' }}>
        <p style={styles.tagline}>Loading...</p>
      </div>
    );
  }

  // Show auth form if not logged in
  if (!user) {
    return (
      <div style={styles.container}>
        <h1 style={styles.logo}>Field Intel</h1>
        <p style={styles.tagline}>
          Transform your voice notes into structured CRM data automatically
        </p>
        <AuthForm onSuccess={handleAuthSuccess} />
      </div>
    );
  }

  // Show main app if logged in
  return (
    <div style={styles.container}>
      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <button
          style={{ ...styles.button, ...styles.secondaryButton, padding: '8px 16px' }}
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </div>

      <h1 style={styles.logo}>Field Intel</h1>
      <p style={styles.tagline}>
        Welcome back, {user.email}!
      </p>

      <div style={styles.buttonContainer}>
        <button
          style={{ ...styles.button, ...styles.primaryButton }}
          onClick={handleStartRecording}
        >
          🎙️ Start Recording
        </button>
        <button
          style={{ ...styles.button, ...styles.secondaryButton }}
          onClick={handleViewHistory}
        >
          📜 View History
        </button>
        <button
          style={{ ...styles.button, ...styles.secondaryButton }}
          onClick={handleViewDashboard}
        >
          📊 Manager Dashboard
        </button>
        <button
          style={{ ...styles.button, ...styles.secondaryButton }}
          onClick={handleSettings}
        >
          ⚙️ Settings
        </button>
      </div>

      <div style={styles.feature}>
        <h3 style={styles.featureTitle}>How It Works</h3>
        <p style={styles.featureText}>
          Record voice notes after meetings • AI transcribes and extracts data •
          Automatically syncs to your CRM • Save 2-3 hours daily
        </p>
      </div>
    </div>
  );
}

export default Home;
