import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { typography, colors } from '../styles/index.js';
import { getUserProfile, updateUserProfile, updateSettings, disconnectCRM, getUserStats } from '../services/settings.js';
import ProfileSection from '../components/settings/ProfileSection.jsx';
import PreferencesSection from '../components/settings/PreferencesSection.jsx';
import CRMSection from '../components/settings/CRMSection.jsx';
import StatsSection from '../components/settings/StatsSection.jsx';

function Settings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('[Settings] Loading settings and profile');
    setLoading(true);
    setError(null);

    try {
      const [profileResult, statsResult] = await Promise.all([
        getUserProfile(),
        getUserStats()
      ]);

      if (profileResult.error) {
        throw profileResult.error;
      }

      if (statsResult.error) {
        console.error('[Settings] Error loading stats:', statsResult.error);
        // Continue even if stats fail
      }

      console.log('[Settings] Data loaded:', { profile: profileResult.data, stats: statsResult.data });
      setProfile(profileResult.data);
      setStats(statsResult.data);
    } catch (err) {
      console.error('[Settings] Error loading data:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (updates) => {
    console.log('[Settings] Updating profile:', updates);
    const result = await updateUserProfile(updates);

    if (!result.error) {
      setProfile(result.data);
    }

    return result;
  };

  const handlePreferencesUpdate = async (newSettings) => {
    console.log('[Settings] Updating preferences:', newSettings);
    const result = await updateSettings(newSettings);

    if (!result.error) {
      setProfile(result.data);
    }

    return result;
  };

  const handleCRMDisconnect = async () => {
    console.log('[Settings] Disconnecting CRM');
    const result = await disconnectCRM();

    if (!result.error) {
      setProfile(result.data);
    }

    return result;
  };

  const handleCRMConnect = (provider) => {
    console.log('[Settings] Initiating CRM connection:', provider);
    // Navigate to CRM OAuth flow
    navigate(`/settings/crm/connect/${provider}`);
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: colors.neutral[50],
    },
    header: {
      padding: '16px 20px',
      backgroundColor: colors.white,
      borderBottom: `1px solid ${colors.neutral[200]}`,
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    backButton: {
      ...typography.button,
      padding: '8px 16px',
      borderRadius: '8px',
      border: `1px solid ${colors.neutral[300]}`,
      backgroundColor: colors.white,
      color: colors.neutral[700],
      cursor: 'pointer',
    },
    title: {
      ...typography.h2,
      color: colors.neutral[900],
    },
    content: {
      padding: '20px',
      maxWidth: '900px',
      margin: '0 auto',
    },
    loadingText: {
      ...typography.body,
      color: colors.neutral[500],
      textAlign: 'center',
      marginTop: '48px',
    },
    errorText: {
      ...typography.body,
      color: colors.danger[600],
      textAlign: 'center',
      marginTop: '48px',
      padding: '16px',
      backgroundColor: colors.danger[50],
      borderRadius: '12px',
    },
  };

  const handleBack = () => {
    console.log('[Settings] Navigate back to home');
    navigate('/');
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <button style={styles.backButton} onClick={handleBack}>
            ← Back
          </button>
          <h2 style={styles.title}>Settings</h2>
        </header>
        <div style={styles.content}>
          <p style={styles.loadingText}>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <button style={styles.backButton} onClick={handleBack}>
            ← Back
          </button>
          <h2 style={styles.title}>Settings</h2>
        </header>
        <div style={styles.content}>
          <div style={styles.errorText}>
            {error}
            <button
              onClick={loadData}
              style={{
                ...typography.button,
                marginTop: '12px',
                padding: '8px 16px',
                backgroundColor: colors.danger[600],
                color: colors.white,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.backButton} onClick={handleBack}>
          ← Back
        </button>
        <h2 style={styles.title}>Settings</h2>
      </header>

      <div style={styles.content}>
        <ProfileSection
          profile={profile}
          onUpdate={handleProfileUpdate}
        />

        <PreferencesSection
          settings={profile?.settings || {}}
          onUpdate={handlePreferencesUpdate}
        />

        <CRMSection
          profile={profile}
          onDisconnect={handleCRMDisconnect}
          onConnect={handleCRMConnect}
        />

        <StatsSection stats={stats} />
      </div>
    </div>
  );
}

export default Settings;
