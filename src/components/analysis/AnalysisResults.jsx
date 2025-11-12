import { typography, colors } from '../../styles/index.js';
import SentimentBadge from './SentimentBadge.jsx';

function AnalysisResults({ analysis }) {
  if (!analysis) {
    return null;
  }

  const {
    summary,
    overall_sentiment,
    sentiment_explanation,
    contacts = [],
    companies = [],
    action_items = [],
    buying_signals = [],
    key_points = [],
    next_steps,
    confidence_score,
  } = analysis;

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
    subtitle: {
      ...typography.h4,
      color: colors.neutral[800],
      marginTop: '20px',
      marginBottom: '12px',
    },
    text: {
      ...typography.body,
      color: colors.neutral[700],
      lineHeight: '1.8',
    },
    list: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    listItem: {
      ...typography.body,
      color: colors.neutral[700],
      padding: '12px',
      backgroundColor: colors.neutral[50],
      borderRadius: '8px',
      marginBottom: '8px',
      borderLeft: `3px solid ${colors.primary[500]}`,
    },
    contactItem: {
      borderLeft: `3px solid ${colors.primary[500]}`,
    },
    actionItem: {
      borderLeft: `3px solid ${colors.warning[500]}`,
    },
    buyingSignal: {
      borderLeft: `3px solid ${colors.success[500]}`,
    },
    itemTitle: {
      ...typography.bodySmall,
      fontWeight: 600,
      color: colors.neutral[900],
      marginBottom: '4px',
    },
    itemDetail: {
      ...typography.bodySmall,
      color: colors.neutral[600],
    },
    badge: {
      ...typography.caption,
      padding: '2px 8px',
      borderRadius: '8px',
      backgroundColor: colors.primary[100],
      color: colors.primary[700],
      marginLeft: '8px',
    },
    confidenceBadge: {
      ...typography.caption,
      padding: '4px 12px',
      borderRadius: '12px',
      fontWeight: 600,
    },
    highConfidence: {
      backgroundColor: colors.success[100],
      color: colors.success[700],
    },
    emptyState: {
      ...typography.bodySmall,
      color: colors.neutral[500],
      fontStyle: 'italic',
    },
  };

  const getConfidenceBadge = (confidence) => {
    if (!confidence) return null;
    const percentage = Math.round(confidence * 100);
    return (
      <span style={styles.confidenceBadge}>
        {percentage}%
      </span>
    );
  };

  return (
    <div style={styles.container}>
      {/* Summary Card */}
      {summary && (
        <div style={styles.card}>
          <div style={styles.header}>
            <h3 style={styles.title}>Summary</h3>
            {overall_sentiment && <SentimentBadge sentiment={overall_sentiment} />}
          </div>
          <p style={styles.text}>{summary}</p>
          {sentiment_explanation && (
            <p style={{ ...styles.text, marginTop: '12px', fontSize: '14px', color: colors.neutral[600] }}>
              {sentiment_explanation}
            </p>
          )}
        </div>
      )}

      {/* Contacts */}
      {contacts.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.title}>Contacts ({contacts.length})</h3>
          <ul style={styles.list}>
            {contacts.map((contact, index) => (
              <li key={index} style={{ ...styles.listItem, ...styles.contactItem }}>
                <div style={styles.itemTitle}>
                  {contact.name}
                  {contact.confidence && getConfidenceBadge(contact.confidence)}
                </div>
                {contact.title && <div style={styles.itemDetail}>{contact.title}</div>}
                {contact.company && <div style={styles.itemDetail}>{contact.company}</div>}
                {contact.email && <div style={styles.itemDetail}>{contact.email}</div>}
                {contact.phone && <div style={styles.itemDetail}>{contact.phone}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Companies */}
      {companies.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.title}>Companies ({companies.length})</h3>
          <ul style={styles.list}>
            {companies.map((company, index) => (
              <li key={index} style={styles.listItem}>
                <div style={styles.itemTitle}>
                  {company.name}
                  {company.confidence && getConfidenceBadge(company.confidence)}
                </div>
                {company.industry && <div style={styles.itemDetail}>Industry: {company.industry}</div>}
                {company.size && <div style={styles.itemDetail}>Size: {company.size}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      {action_items.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.title}>Action Items ({action_items.length})</h3>
          <ul style={styles.list}>
            {action_items.map((item, index) => (
              <li key={index} style={{ ...styles.listItem, ...styles.actionItem }}>
                <div style={styles.itemTitle}>
                  {item.task}
                  {item.priority && (
                    <span style={{
                      ...styles.badge,
                      backgroundColor: item.priority === 'high' ? colors.danger[100] :
                                      item.priority === 'medium' ? colors.warning[100] : colors.neutral[100],
                      color: item.priority === 'high' ? colors.danger[700] :
                             item.priority === 'medium' ? colors.warning[700] : colors.neutral[700],
                    }}>
                      {item.priority}
                    </span>
                  )}
                  {item.confidence && getConfidenceBadge(item.confidence)}
                </div>
                {item.due_date && <div style={styles.itemDetail}>Due: {item.due_date}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Buying Signals */}
      {buying_signals.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.title}>Buying Signals ({buying_signals.length})</h3>
          <ul style={styles.list}>
            {buying_signals.map((signal, index) => (
              <li key={index} style={{ ...styles.listItem, ...styles.buyingSignal }}>
                <div style={styles.itemTitle}>
                  {signal.signal}
                  {signal.strength && (
                    <span style={{
                      ...styles.badge,
                      backgroundColor: signal.strength === 'high' ? colors.success[100] :
                                      signal.strength === 'medium' ? colors.warning[100] : colors.neutral[100],
                      color: signal.strength === 'high' ? colors.success[700] :
                             signal.strength === 'medium' ? colors.warning[700] : colors.neutral[700],
                    }}>
                      {signal.strength}
                    </span>
                  )}
                  {signal.confidence && getConfidenceBadge(signal.confidence)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Points */}
      {key_points.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.title}>Key Points</h3>
          <ul style={styles.list}>
            {key_points.map((point, index) => (
              <li key={index} style={styles.listItem}>
                <div style={styles.text}>
                  {point.point}
                  {point.importance && (
                    <span style={{
                      ...styles.badge,
                      backgroundColor: point.importance === 'high' ? colors.primary[100] : colors.neutral[100],
                      color: point.importance === 'high' ? colors.primary[700] : colors.neutral[700],
                    }}>
                      {point.importance}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      {next_steps && (
        <div style={styles.card}>
          <h3 style={styles.title}>Next Steps</h3>
          <p style={styles.text}>{next_steps}</p>
        </div>
      )}

      {/* Overall Confidence */}
      {confidence_score !== undefined && (
        <div style={styles.card}>
          <div style={styles.header}>
            <h3 style={styles.title}>AI Confidence Score</h3>
            <span style={{
              ...styles.confidenceBadge,
              ...(confidence_score >= 0.8 ? styles.highConfidence : {}),
            }}>
              {Math.round(confidence_score * 100)}%
            </span>
          </div>
          <p style={styles.text}>
            {confidence_score >= 0.8
              ? 'High confidence - Safe to auto-sync to CRM'
              : 'Medium/Low confidence - Please review before syncing to CRM'}
          </p>
        </div>
      )}
    </div>
  );
}

export default AnalysisResults;
