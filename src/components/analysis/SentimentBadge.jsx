import { typography, colors } from '../../styles/index.js';

function SentimentBadge({ sentiment }) {
  const getSentimentStyle = () => {
    const baseStyle = {
      ...typography.caption,
      padding: '6px 16px',
      borderRadius: '12px',
      fontWeight: 600,
      display: 'inline-block',
    };

    switch (sentiment) {
      case 'positive':
        return {
          ...baseStyle,
          backgroundColor: colors.success[100],
          color: colors.success[700],
        };
      case 'negative':
        return {
          ...baseStyle,
          backgroundColor: colors.danger[100],
          color: colors.danger[700],
        };
      case 'urgent':
        return {
          ...baseStyle,
          backgroundColor: colors.warning[100],
          color: colors.warning[800],
        };
      case 'neutral':
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.neutral[200],
          color: colors.neutral[700],
        };
    }
  };

  const getSentimentIcon = () => {
    switch (sentiment) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😟';
      case 'urgent':
        return '⚡';
      case 'neutral':
      default:
        return '😐';
    }
  };

  const getSentimentLabel = () => {
    return sentiment ? sentiment.charAt(0).toUpperCase() + sentiment.slice(1) : 'Neutral';
  };

  return (
    <span style={getSentimentStyle()}>
      {getSentimentIcon()} {getSentimentLabel()}
    </span>
  );
}

export default SentimentBadge;
