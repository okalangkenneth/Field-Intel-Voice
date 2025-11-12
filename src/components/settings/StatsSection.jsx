import { typography, colors } from '../../styles/index.js';
import SettingsSection from './SettingsSection.jsx';

function StatsSection({ stats }) {
  const formatDuration = (ms) => {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const styles = {
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '16px',
    },
    stat: {
      textAlign: 'center',
      padding: '20px',
      backgroundColor: colors.neutral[50],
      borderRadius: '12px',
    },
    statValue: {
      ...typography.numberLarge,
      color: colors.primary[600],
      marginBottom: '4px',
    },
    statLabel: {
      ...typography.caption,
      color: colors.neutral[600],
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
  };

  return (
    <SettingsSection
      title="Your Statistics"
      description="Overview of your recording activity"
    >
      <div style={styles.grid}>
        <div style={styles.stat}>
          <div style={styles.statValue}>
            {stats?.totalRecordings || 0}
          </div>
          <div style={styles.statLabel}>Total Recordings</div>
        </div>

        <div style={styles.stat}>
          <div style={styles.statValue}>
            {formatDuration(stats?.totalDuration || 0)}
          </div>
          <div style={styles.statLabel}>Total Duration</div>
        </div>

        <div style={styles.stat}>
          <div style={styles.statValue}>
            {stats?.recordingsThisWeek || 0}
          </div>
          <div style={styles.statLabel}>This Week</div>
        </div>
      </div>
    </SettingsSection>
  );
}

export default StatsSection;
