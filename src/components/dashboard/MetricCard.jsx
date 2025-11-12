import { typography, colors } from '../../styles/index.js';

function MetricCard({ title, value, subtitle, icon, color = 'primary' }) {
  const colorMap = {
    primary: colors.primary[600],
    success: colors.success[600],
    warning: colors.warning[600],
    danger: colors.danger[600],
    neutral: colors.neutral[600],
  };

  const bgColorMap = {
    primary: colors.primary[50],
    success: colors.success[50],
    warning: colors.warning[50],
    danger: colors.danger[50],
    neutral: colors.neutral[50],
  };

  const styles = {
    card: {
      backgroundColor: colors.white,
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    title: {
      ...typography.bodySmall,
      color: colors.neutral[600],
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    iconContainer: {
      width: '40px',
      height: '40px',
      borderRadius: '12px',
      backgroundColor: bgColorMap[color],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
    },
    value: {
      ...typography.numberLarge,
      color: colorMap[color],
    },
    subtitle: {
      ...typography.caption,
      color: colors.neutral[500],
    },
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.title}>{title}</div>
        {icon && <div style={styles.iconContainer}>{icon}</div>}
      </div>
      <div style={styles.value}>{value}</div>
      {subtitle && <div style={styles.subtitle}>{subtitle}</div>}
    </div>
  );
}

export default MetricCard;
