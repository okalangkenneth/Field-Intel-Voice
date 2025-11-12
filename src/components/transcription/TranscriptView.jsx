import { typography, colors } from '../../styles/index.js';

function TranscriptView({ transcript, confidence, wordCount }) {
  const styles = {
    container: {
      backgroundColor: colors.white,
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '16px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },
    title: {
      ...typography.h3,
      color: colors.neutral[900],
    },
    badge: {
      ...typography.caption,
      padding: '4px 12px',
      borderRadius: '12px',
      fontWeight: 600,
    },
    highConfidence: {
      backgroundColor: colors.success[100],
      color: colors.success[700],
    },
    mediumConfidence: {
      backgroundColor: colors.warning[100],
      color: colors.warning[700],
    },
    lowConfidence: {
      backgroundColor: colors.danger[100],
      color: colors.danger[700],
    },
    meta: {
      ...typography.bodySmall,
      color: colors.neutral[500],
      marginBottom: '12px',
    },
    text: {
      ...typography.body,
      color: colors.neutral[800],
      lineHeight: '1.8',
      whiteSpace: 'pre-wrap',
    },
  };

  const getConfidenceBadgeStyle = () => {
    if (confidence >= 0.8) return { ...styles.badge, ...styles.highConfidence };
    if (confidence >= 0.6) return { ...styles.badge, ...styles.mediumConfidence };
    return { ...styles.badge, ...styles.lowConfidence };
  };

  const getConfidenceLabel = () => {
    if (confidence >= 0.8) return `High Confidence (${Math.round(confidence * 100)}%)`;
    if (confidence >= 0.6) return `Medium Confidence (${Math.round(confidence * 100)}%)`;
    return `Low Confidence (${Math.round(confidence * 100)}%)`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Transcription</h3>
        {confidence !== undefined && (
          <span style={getConfidenceBadgeStyle()}>
            {getConfidenceLabel()}
          </span>
        )}
      </div>

      {wordCount && (
        <div style={styles.meta}>
          {wordCount} words
        </div>
      )}

      <div style={styles.text}>
        {transcript || 'No transcription available'}
      </div>
    </div>
  );
}

export default TranscriptView;
