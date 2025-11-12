import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { typography, colors } from '../styles/index.js';
import { getRecordings } from '../services/recording.js';
import TranscriptView from '../components/transcription/TranscriptView.jsx';
import AnalysisResults from '../components/analysis/AnalysisResults.jsx';
import SentimentBadge from '../components/analysis/SentimentBadge.jsx';

function History() {
  const navigate = useNavigate();
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRecording, setExpandedRecording] = useState(null);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    console.log('[History] Loading recordings');
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await getRecordings(50);

      if (error) {
        throw error;
      }

      console.log('[History] Loaded recordings:', data?.length || 0);
      setRecordings(data || []);
    } catch (err) {
      console.error('[History] Error loading recordings:', err);
      setError(err.message || 'Failed to load recordings');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      completed: { bg: colors.neutral[100], color: colors.neutral[700] },
      transcribing: { bg: colors.primary[100], color: colors.primary[700] },
      transcribed: { bg: colors.primary[100], color: colors.primary[700] },
      analyzing: { bg: colors.warning[100], color: colors.warning[700] },
      analyzed: { bg: colors.success[100], color: colors.success[700] },
      syncing: { bg: colors.warning[100], color: colors.warning[700] },
      synced: { bg: colors.success[100], color: colors.success[700] },
      failed: { bg: colors.danger[100], color: colors.danger[700] },
    };

    const style = statusStyles[status] || statusStyles.completed;

    return (
      <span
        style={{
          ...typography.caption,
          padding: '4px 12px',
          borderRadius: '12px',
          backgroundColor: style.bg,
          color: style.color,
          fontWeight: 600,
        }}
      >
        {status}
      </span>
    );
  };

  const toggleExpand = (recordingId) => {
    setExpandedRecording(expandedRecording === recordingId ? null : recordingId);
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
    content: {
      padding: '20px',
      maxWidth: '800px',
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
    emptyState: {
      ...typography.body,
      color: colors.neutral[500],
      textAlign: 'center',
      marginTop: '48px',
    },
    recordingCard: {
      backgroundColor: colors.white,
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    recordingCardHover: {
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
    recordingHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px',
    },
    recordingInfo: {
      flex: 1,
    },
    recordingDate: {
      ...typography.bodySmall,
      color: colors.neutral[600],
      marginBottom: '8px',
    },
    recordingMeta: {
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
      marginTop: '8px',
    },
    metaItem: {
      ...typography.caption,
      color: colors.neutral[500],
    },
    transcriptPreview: {
      ...typography.bodySmall,
      color: colors.neutral[700],
      marginTop: '12px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
    },
    expandedContent: {
      marginTop: '24px',
      paddingTop: '24px',
      borderTop: `1px solid ${colors.neutral[200]}`,
    },
  };

  const handleBack = () => {
    console.log('[History] Navigate back to home');
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backButton} onClick={handleBack}>
            ← Back
          </button>
          <h2 style={styles.title}>Recording History</h2>
        </div>
        {recordings.length > 0 && (
          <span style={{ ...typography.bodySmall, color: colors.neutral[500] }}>
            {recordings.length} recording{recordings.length !== 1 ? 's' : ''}
          </span>
        )}
      </header>

      <div style={styles.content}>
        {loading && <p style={styles.loadingText}>Loading recordings...</p>}

        {error && (
          <div style={styles.errorText}>
            {error}
            <button
              onClick={loadRecordings}
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
        )}

        {!loading && !error && recordings.length === 0 && (
          <p style={styles.emptyState}>
            No recordings yet. Start by recording your first voice note!
          </p>
        )}

        {!loading && !error && recordings.length > 0 && (
          <div>
            {recordings.map((recording) => {
              const isExpanded = expandedRecording === recording.id;
              const transcription = recording.transcriptions?.[0];
              const analysis = recording.analysis_results?.[0];

              return (
                <div
                  key={recording.id}
                  style={styles.recordingCard}
                  onClick={() => toggleExpand(recording.id)}
                >
                  <div style={styles.recordingHeader}>
                    <div style={styles.recordingInfo}>
                      <div style={styles.recordingDate}>
                        {formatDate(recording.created_at)}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {getStatusBadge(recording.status)}
                        {analysis?.overall_sentiment && (
                          <SentimentBadge sentiment={analysis.overall_sentiment} />
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={styles.recordingMeta}>
                    <span style={styles.metaItem}>
                      Duration: {formatDuration(recording.duration_ms)}
                    </span>
                    {transcription?.word_count && (
                      <span style={styles.metaItem}>
                        {transcription.word_count} words
                      </span>
                    )}
                    {transcription?.confidence_score && (
                      <span style={styles.metaItem}>
                        Confidence: {Math.round(transcription.confidence_score * 100)}%
                      </span>
                    )}
                  </div>

                  {transcription?.transcript_text && !isExpanded && (
                    <div style={styles.transcriptPreview}>
                      {transcription.transcript_text}
                    </div>
                  )}

                  {analysis?.summary && !isExpanded && (
                    <div style={styles.transcriptPreview}>
                      <strong>Summary:</strong> {analysis.summary}
                    </div>
                  )}

                  {isExpanded && (
                    <div style={styles.expandedContent}>
                      {transcription && (
                        <TranscriptView
                          transcript={transcription.transcript_text}
                          confidence={transcription.confidence_score}
                          wordCount={transcription.word_count}
                        />
                      )}

                      {analysis && <AnalysisResults analysis={analysis} />}

                      {recording.status === 'failed' && recording.error_message && (
                        <div style={styles.errorText}>
                          Error: {recording.error_message}
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    style={{
                      ...typography.caption,
                      color: colors.primary[600],
                      marginTop: '12px',
                      textAlign: 'center',
                    }}
                  >
                    {isExpanded ? '▲ Click to collapse' : '▼ Click to expand'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
