import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { typography, colors } from '../styles/index.js';
import { getDashboardMetrics, subscribeToDashboardUpdates } from '../services/dashboard.js';
import MetricCard from '../components/dashboard/MetricCard.jsx';
import ActivityFeed from '../components/dashboard/ActivityFeed.jsx';
import SentimentChart from '../components/dashboard/SentimentChart.jsx';

function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMetrics();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToDashboardUpdates((type, payload) => {
      console.log('[Dashboard] Real-time update:', type);
      // Refresh metrics when data changes
      loadMetrics();
    });

    return () => unsubscribe();
  }, []);

  const loadMetrics = async () => {
    console.log('[Dashboard] Loading metrics');
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await getDashboardMetrics();

      if (error) {
        throw error;
      }

      console.log('[Dashboard] Metrics loaded:', data);
      setMetrics(data);
    } catch (err) {
      console.error('[Dashboard] Error loading metrics:', err);
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
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
      justifyContent: 'space-between',
    },
    headerLeft: {
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
    refreshButton: {
      ...typography.button,
      padding: '8px 16px',
      borderRadius: '8px',
      backgroundColor: colors.primary[600],
      color: colors.white,
      border: 'none',
      cursor: 'pointer',
    },
    content: {
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto',
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '24px',
    },
    twoColumnGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '20px',
      marginBottom: '24px',
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
    topPerformers: {
      backgroundColor: colors.white,
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.neutral[900],
      marginBottom: '20px',
    },
    performersList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    performerItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 16px',
      backgroundColor: colors.neutral[50],
      borderRadius: '8px',
    },
    performerName: {
      ...typography.bodySmall,
      fontWeight: 600,
      color: colors.neutral[900],
    },
    performerCount: {
      ...typography.bodySmall,
      fontWeight: 600,
      color: colors.primary[600],
    },
  };

  const handleBack = () => {
    console.log('[Dashboard] Navigate back to home');
    navigate('/');
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button style={styles.backButton} onClick={handleBack}>
              ← Back
            </button>
            <h2 style={styles.title}>Manager Dashboard</h2>
          </div>
        </header>
        <div style={styles.content}>
          <p style={styles.loadingText}>Loading dashboard metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button style={styles.backButton} onClick={handleBack}>
              ← Back
            </button>
            <h2 style={styles.title}>Manager Dashboard</h2>
          </div>
        </header>
        <div style={styles.content}>
          <div style={styles.errorText}>
            {error}
            <button
              onClick={loadMetrics}
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
        <div style={styles.headerLeft}>
          <button style={styles.backButton} onClick={handleBack}>
            ← Back
          </button>
          <h2 style={styles.title}>Manager Dashboard</h2>
        </div>
        <button style={styles.refreshButton} onClick={loadMetrics}>
          🔄 Refresh
        </button>
      </header>

      <div style={styles.content}>
        {/* Key Metrics */}
        <div style={styles.metricsGrid}>
          <MetricCard
            title="Total Recordings"
            value={metrics?.totalRecordings || 0}
            subtitle="All time"
            icon="🎙️"
            color="primary"
          />
          <MetricCard
            title="Today"
            value={metrics?.recordingsToday || 0}
            subtitle="Recordings today"
            icon="📅"
            color="success"
          />
          <MetricCard
            title="This Week"
            value={metrics?.recordingsThisWeek || 0}
            subtitle="Last 7 days"
            icon="📊"
            color="warning"
          />
          <MetricCard
            title="Avg Confidence"
            value={`${Math.round((metrics?.avgConfidence || 0) * 100)}%`}
            subtitle="AI extraction quality"
            icon="✨"
            color="primary"
          />
        </div>

        {/* Additional Metrics */}
        <div style={styles.metricsGrid}>
          <MetricCard
            title="Contacts"
            value={metrics?.totalContacts || 0}
            subtitle="Total extracted"
            icon="👤"
            color="success"
          />
          <MetricCard
            title="Action Items"
            value={metrics?.totalActionItems || 0}
            subtitle="Follow-ups needed"
            icon="✓"
            color="warning"
          />
          <MetricCard
            title="Buying Signals"
            value={metrics?.totalBuyingSignals || 0}
            subtitle="Opportunities identified"
            icon="💰"
            color="success"
          />
        </div>

        {/* Sentiment & Top Performers */}
        <div style={styles.twoColumnGrid}>
          <SentimentChart sentimentCounts={metrics?.sentimentCounts} />

          <div style={styles.topPerformers}>
            <h3 style={styles.sectionTitle}>Top Performers</h3>
            {metrics?.topPerformers && metrics.topPerformers.length > 0 ? (
              <div style={styles.performersList}>
                {metrics.topPerformers.map((performer, index) => (
                  <div key={performer.userId} style={styles.performerItem}>
                    <div>
                      <div style={styles.performerName}>
                        {index + 1}. {performer.fullName || performer.email}
                      </div>
                      <div style={{ ...typography.caption, color: colors.neutral[500] }}>
                        {Math.floor(performer.totalDuration / 60000)} min total
                      </div>
                    </div>
                    <div style={styles.performerCount}>{performer.count} recordings</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ ...typography.body, color: colors.neutral[500], textAlign: 'center', padding: '20px' }}>
                No data yet
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <ActivityFeed activities={metrics?.recentActivity} />
      </div>
    </div>
  );
}

export default Dashboard;
