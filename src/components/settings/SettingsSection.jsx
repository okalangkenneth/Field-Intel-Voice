import { typography, colors } from '../../styles/index.js';

function SettingsSection({ title, description, children }) {
  const styles = {
    section: {
      backgroundColor: colors.white,
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '20px',
    },
    header: {
      marginBottom: '20px',
      paddingBottom: '16px',
      borderBottom: `1px solid ${colors.neutral[200]}`,
    },
    title: {
      ...typography.h3,
      color: colors.neutral[900],
      marginBottom: '4px',
    },
    description: {
      ...typography.bodySmall,
      color: colors.neutral[600],
    },
  };

  return (
    <div style={styles.section}>
      <div style={styles.header}>
        <h3 style={styles.title}>{title}</h3>
        {description && <p style={styles.description}>{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default SettingsSection;
