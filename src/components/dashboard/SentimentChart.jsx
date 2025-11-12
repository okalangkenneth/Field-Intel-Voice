import { typography, colors } from '../../styles/index.js';

function SentimentChart({ sentimentCounts = {} }) {
  const { positive = 0, neutral = 0, negative = 0, urgent = 0 } = sentimentCounts;
  const total = positive + neutral + negative + urgent;

  const calculatePercentage = (count) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
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
    bars: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    barRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    label: {
      ...typography.bodySmall,
      fontWeight: 600,
      minWidth: '80px',
    },
    barContainer: {
      flex: 1,
      height: '32px',
      backgroundColor: colors.neutral[100],
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative',
    },
    barFill: {
      height: '100%',
      borderRadius: '8px',
      transition: 'width 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '12px',
    },
    percentage: {
      ...typography.caption,
      fontWeight: 600,
      color: colors.white,
    },
    count: {
      ...typography.bodySmall,
      fontWeight: 600,
      minWidth: '40px',
      textAlign: 'right',
    },
    emptyState: {
      ...typography.body,
      color: colors.neutral[500],
      textAlign: 'center',
      padding: '40px 20px',
    },
  };

  const sentiments = [
    { name: 'Positive', value: positive, color: colors.success[600], emoji: '😊' },
    { name: 'Neutral', value: neutral, color: colors.neutral[500], emoji: '😐' },
    { name: 'Negative', value: negative, color: colors.danger[600], emoji: '😟' },
    { name: 'Urgent', value: urgent, color: colors.warning[600], emoji: '⚡' },
  ];

  if (total === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Sentiment Distribution</h3>
        <div style={styles.emptyState}>
          No sentiment data yet. Recordings need to be analyzed first.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Sentiment Distribution</h3>
      <div style={styles.bars}>
        {sentiments.map((sentiment) => {
          const percentage = calculatePercentage(sentiment.value);
          return (
            <div key={sentiment.name} style={styles.barRow}>
              <div style={styles.label}>
                {sentiment.emoji} {sentiment.name}
              </div>
              <div style={styles.barContainer}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${percentage}%`,
                    backgroundColor: sentiment.color,
                  }}
                >
                  {percentage > 15 && (
                    <span style={styles.percentage}>{percentage}%</span>
                  )}
                </div>
              </div>
              <div style={{ ...styles.count, color: sentiment.color }}>
                {sentiment.value}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: '16px', textAlign: 'center', ...typography.caption, color: colors.neutral[500] }}>
        Total: {total} analyzed recordings
      </div>
    </div>
  );
}

export default SentimentChart;
