import { useNavigate } from 'react-router-dom';
import { typography, colors } from '../styles/index.js';
import VoiceRecorder from '../components/voice/VoiceRecorder.jsx';

function Record() {
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
      maxWidth: '600px',
      margin: '0 auto',
    },
  };

  const handleBack = () => {
    console.log('[Record] Navigate back to home');
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.backButton} onClick={handleBack}>
          ← Back
        </button>
        <h2 style={styles.title}>Record Voice Note</h2>
      </header>

      <div style={styles.content}>
        <VoiceRecorder />
      </div>
    </div>
  );
}

export default Record;
