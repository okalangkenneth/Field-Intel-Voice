import { useState } from 'react';
import { typography, colors } from '../../styles/index.js';
import SettingsSection from './SettingsSection.jsx';

function ProfileSection({ profile, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSave = async () => {
    console.log('[ProfileSection] Saving profile:', { fullName });
    setSaving(true);
    setMessage(null);

    const result = await onUpdate({ full_name: fullName });

    setSaving(false);

    if (result.error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setEditing(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleCancel = () => {
    setFullName(profile?.full_name || '');
    setEditing(false);
    setMessage(null);
  };

  const styles = {
    field: {
      marginBottom: '16px',
    },
    label: {
      ...typography.label,
      color: colors.neutral[700],
      display: 'block',
      marginBottom: '6px',
    },
    input: {
      ...typography.input,
      width: '100%',
      padding: '10px 12px',
      borderRadius: '8px',
      border: `1px solid ${colors.neutral[300]}`,
      backgroundColor: colors.white,
      color: colors.neutral[900],
      outline: 'none',
    },
    inputDisabled: {
      backgroundColor: colors.neutral[100],
      color: colors.neutral[500],
      cursor: 'not-allowed',
    },
    value: {
      ...typography.body,
      color: colors.neutral[900],
      padding: '10px 0',
    },
    role: {
      ...typography.caption,
      padding: '4px 12px',
      borderRadius: '12px',
      backgroundColor: colors.primary[100],
      color: colors.primary[700],
      display: 'inline-block',
      textTransform: 'capitalize',
    },
    buttons: {
      display: 'flex',
      gap: '12px',
      marginTop: '20px',
    },
    button: {
      ...typography.button,
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    primaryButton: {
      backgroundColor: colors.primary[600],
      color: colors.white,
    },
    secondaryButton: {
      backgroundColor: colors.white,
      color: colors.neutral[700],
      border: `1px solid ${colors.neutral[300]}`,
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

  return (
    <SettingsSection
      title="Profile"
      description="Manage your personal information"
    >
      <div style={styles.field}>
        <label style={styles.label}>Email</label>
        <input
          type="email"
          value={profile?.email || ''}
          disabled
          style={{ ...styles.input, ...styles.inputDisabled }}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Full Name</label>
        {editing ? (
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            style={styles.input}
          />
        ) : (
          <div style={styles.value}>
            {profile?.full_name || 'Not set'}
          </div>
        )}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Role</label>
        <span style={styles.role}>
          {profile?.role || 'sales_rep'}
        </span>
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

      <div style={styles.buttons}>
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ ...styles.button, ...styles.primaryButton }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            Edit Profile
          </button>
        )}
      </div>
    </SettingsSection>
  );
}

export default ProfileSection;
