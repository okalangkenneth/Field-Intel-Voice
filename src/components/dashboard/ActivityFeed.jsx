import { typography, colors } from '../../styles/index.js';
import SentimentBadge from '../analysis/SentimentBadge.jsx';

function ActivityFeed({ activities = [] }) {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    const statusColors = {
      completed: colors.neutral[500],
      transcribing: colors.primary[600],
      transcribed: colors.primary[600],
      analyzing: colors.warning[600],
      analyzed: colors.success[600],
      failed: colors.danger[600],
    };
    return statusColors[status] || colors.neutral[500];
  };

  const styles = {
    container: {
      backgroundColor: colors.white,
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    title: {
      ...typography.h3,
      color: colors.neutral[900],
      marginBottom: '20px',
    },
    list: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    item: {
      padding: '16px',
      backgroundColor: colors.neutral[50],
      borderRadius: '12px',
      borderLeft: `3px solid ${colors.primary[500]}`,
    },
    itemHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '8px',
    },
    userName: {
      ...typography.bodySmall,
      fontWeight: 600,
      color: colors.neutral[900],
    },
    time: {
      ...typography.caption,
      color: colors.neutral[500],
    },
    details: {
      ...typography.caption,
      color: colors.neutral[600],
      marginTop: '4px',
    },
    statusBadge: {
      ...typography.caption,
      padding: '2px 8px',
      borderRadius: '8px',
      backgroundColor: colors.primary[100],
      color: colors.primary[700],
      marginLeft: '8px',
    },
    emptyState: {
      ...typography.body,
      color: colors.neutral[500],
      textAlign: 'center',
      padding: '40px 20px',
    },
  };

  if (!activities || activities.length === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Recent Activity</h3>
        <div style={styles.emptyState}>
          No recent activity. Start recording to see team activity here!
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Recent Activity</h3>
      <div style={styles.list}>
        {activities.map((activity) => {
          const sentiment = activity.analysis_results?.[0]?.overall_sentiment;
          const contacts = activity.analysis_results?.[0]?.contacts || [];
          const actionItems = activity.analysis_results?.[0]?.action_items || [];

          return (
            <div key={activity.id} style={styles.item}>
              <div style={styles.itemHeader}>
                <div>
                  <div style={styles.userName}>
                    {activity.user_profiles?.full_name || activity.user_profiles?.email || 'Unknown User'}
                  </div>
                  <div style={styles.time}>{formatTime(activity.created_at)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {sentiment && <SentimentBadge sentiment={sentiment} />}
                  <span
                    style={{
                      ...styles.statusBadge,
                      color: getStatusColor(activity.status),
                      backgroundColor: `${getStatusColor(activity.status)}20`,
                    }}
                  >
                    {activity.status}
                  </span>
                </div>
              </div>

              <div style={styles.details}>
                Duration: {formatDuration(activity.duration_ms)}
                {contacts.length > 0 && ` • ${contacts.length} contact${contacts.length > 1 ? 's' : ''}`}
                {actionItems.length > 0 && ` • ${actionItems.length} action item${actionItems.length > 1 ? 's' : ''}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ActivityFeed;
