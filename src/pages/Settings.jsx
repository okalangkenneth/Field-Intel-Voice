import { useNavigate } from 'react-router-dom';
import { typography, colors } from '../styles/index.js';

function Settings() {
  const navigate = useNavigate();

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
    },
    placeholder: {
      ...typography.body,
      color: colors.neutral[500],
      textAlign: 'center',
      marginTop: '48px',
    },
  };

  const handleBack = () => {
    console.log('[Settings] Navigate back to home');
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.backButton} onClick={handleBack}>
          ← Back
        </button>
        <h2 style={styles.title}>Settings</h2>
      </header>

      <div style={styles.content}>
        <p style={styles.placeholder}>
          App settings and CRM integrations will appear here
        </p>
      </div>
    </div>
  );
}

export default Settings;
