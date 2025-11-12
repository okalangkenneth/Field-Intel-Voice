import { useState } from 'react';
import { typography, colors } from '../../styles/index.js';
import SettingsSection from './SettingsSection.jsx';

function PreferencesSection({ settings, onUpdate }) {
  const [autoSync, setAutoSync] = useState(settings?.autoSyncToCRM ?? true);
  const [notifyOnComplete, setNotifyOnComplete] = useState(settings?.notifyOnComplete ?? true);
  const [maxDuration, setMaxDuration] = useState(settings?.maxRecordingDuration ?? 300);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSave = async () => {
    console.log('[PreferencesSection] Saving preferences:', { autoSync, notifyOnComplete, maxDuration });
    setSaving(true);
    setMessage(null);

    const result = await onUpdate({
      autoSyncToCRM: autoSync,
      notifyOnComplete,
      maxRecordingDuration: maxDuration,
    });

    setSaving(false);

    if (result.error) {
      setMessage({ type: 'error', text: 'Failed to update preferences' });
    } else {
      setMessage({ type: 'success', text: 'Preferences saved successfully' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const styles = {
    field: {
      marginBottom: '20px',
    },
    label: {
      ...typography.label,
      color: colors.neutral[700],
      display: 'block',
      marginBottom: '6px',
    },
    description: {
      ...typography.caption,
      color: colors.neutral[500],
      marginTop: '4px',
    },
    toggle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px',
      backgroundColor: colors.neutral[50],
      borderRadius: '8px',
      marginBottom: '12px',
    },
    toggleLabel: {
      flex: 1,
    },
    toggleTitle: {
      ...typography.bodySmall,
      fontWeight: 600,
      color: colors.neutral[900],
      marginBottom: '2px',
    },
    toggleDescription: {
      ...typography.caption,
      color: colors.neutral[600],
    },
    switch: {
      position: 'relative',
      width: '48px',
      height: '24px',
      backgroundColor: colors.neutral[300],
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    switchActive: {
      backgroundColor: colors.primary[600],
    },
    switchHandle: {
      position: 'absolute',
      top: '2px',
      left: '2px',
      width: '20px',
      height: '20px',
      backgroundColor: colors.white,
      borderRadius: '50%',
      transition: 'transform 0.2s',
    },
    switchHandleActive: {
      transform: 'translateX(24px)',
    },
    slider: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    input: {
      ...typography.input,
      width: '80px',
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${colors.neutral[300]}`,
      backgroundColor: colors.white,
      color: colors.neutral[900],
      textAlign: 'center',
    },
    sliderTrack: {
      flex: 1,
      height: '4px',
      backgroundColor: colors.neutral[200],
      borderRadius: '2px',
      position: 'relative',
    },
    sliderFill: {
      height: '100%',
      backgroundColor: colors.primary[600],
      borderRadius: '2px',
    },
    button: {
      ...typography.button,
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: colors.primary[600],
      color: colors.white,
      marginTop: '20px',
    },
    message: {
      ...typography.bodySmall,
      padding: '12px 16px',
      borderRadius: '8px',
      marginTop: '16px',
    },
    successMessage: {
      backgroundColor: colors.success[50],
      color: colors.success[700],
      border: `1px solid ${colors.success[200]}`,
    },
    errorMessage: {
      backgroundColor: colors.danger[50],
      color: colors.danger[700],
      border: `1px solid ${colors.danger[200]}`,
    },
  };

  const ToggleSwitch = ({ checked, onChange, title, description }) => (
    <div style={styles.toggle}>
      <div style={styles.toggleLabel}>
        <div style={styles.toggleTitle}>{title}</div>
        <div style={styles.toggleDescription}>{description}</div>
      </div>
      <div
        onClick={() => onChange(!checked)}
        style={{
          ...styles.switch,
          ...(checked ? styles.switchActive : {}),
        }}
      >
        <div
          style={{
            ...styles.switchHandle,
            ...(checked ? styles.switchHandleActive : {}),
          }}
        />
      </div>
    </div>
  );

  return (
    <SettingsSection
      title="Recording Preferences"
      description="Customize your recording experience"
    >
      <ToggleSwitch
        checked={autoSync}
        onChange={setAutoSync}
        title="Auto-sync to CRM"
        description="Automatically sync recordings to your connected CRM when analysis completes"
      />

      <ToggleSwitch
        checked={notifyOnComplete}
        onChange={setNotifyOnComplete}
        title="Notifications"
        description="Get notified when transcription and analysis are complete"
      />

      <div style={styles.field}>
        <label style={styles.label}>Maximum Recording Duration</label>
        <div style={styles.slider}>
          <input
            type="number"
            value={maxDuration}
            onChange={(e) => setMaxDuration(Math.max(30, Math.min(600, parseInt(e.target.value) || 300)))}
            min="30"
            max="600"
            step="30"
            style={styles.input}
          />
          <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>seconds</span>
        </div>
        <div style={styles.description}>
          Recordings will automatically stop after this duration (30-600 seconds)
        </div>
      </div>

      {message && (
        <div
          style={{
            ...styles.message,
            ...(message.type === 'success' ? styles.successMessage : styles.errorMessage),
          }}
        >
          {message.text}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        style={styles.button}
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </SettingsSection>
  );
}

export default PreferencesSection;
