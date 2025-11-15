import { useState } from 'react';
import { typography, colors } from '../../styles/index.js';
import SettingsSection from './SettingsSection.jsx';
import { initiateSalesforceAuth } from '../../services/crm/salesforce.js';

function CRMSection({ profile, onDisconnect, onConnect }) {
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your CRM? This will stop automatic syncing.')) {
      return;
    }

    console.log('[CRMSection] Disconnecting CRM');
    setDisconnecting(true);
    setMessage(null);

    const result = await onDisconnect();

    setDisconnecting(false);

    if (result.error) {
      setMessage({ type: 'error', text: 'Failed to disconnect CRM' });
    } else {
      setMessage({ type: 'success', text: 'CRM disconnected successfully' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleConnect = async (provider) => {
    console.log('[CRMSection] Connecting to:', provider);

    if (provider === 'salesforce') {
      console.log('[CRMSection] Calling initiateSalesforceAuth()...');
      try {
        await initiateSalesforceAuth();
        console.log('[CRMSection] initiateSalesforceAuth() completed');
      } catch (error) {
        console.error('[CRMSection] Error during Salesforce OAuth:', error);
      }
    } else {
      // For other providers, use the parent handler
      onConnect(provider);
    }
  };

  const styles = {
    status: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px',
      backgroundColor: colors.neutral[50],
      borderRadius: '12px',
      marginBottom: '20px',
    },
    statusIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
    },
    connectedIcon: {
      backgroundColor: colors.success[100],
    },
    disconnectedIcon: {
      backgroundColor: colors.neutral[200],
    },
    statusInfo: {
      flex: 1,
    },
    statusTitle: {
      ...typography.bodySmall,
      fontWeight: 600,
      color: colors.neutral[900],
      marginBottom: '2px',
    },
    statusDescription: {
      ...typography.caption,
      color: colors.neutral[600],
    },
    badge: {
      ...typography.caption,
      padding: '4px 12px',
      borderRadius: '12px',
      textTransform: 'capitalize',
    },
    connectedBadge: {
      backgroundColor: colors.success[100],
      color: colors.success[700],
    },
    disconnectedBadge: {
      backgroundColor: colors.neutral[200],
      color: colors.neutral[700],
    },
    providers: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '12px',
      marginBottom: '20px',
    },
    providerCard: {
      padding: '16px',
      border: `2px solid ${colors.neutral[200]}`,
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      textAlign: 'center',
    },
    providerCardHover: {
      borderColor: colors.primary[600],
      backgroundColor: colors.primary[50],
    },
    providerLogo: {
      fontSize: '32px',
      marginBottom: '8px',
    },
    providerName: {
      ...typography.bodySmall,
      fontWeight: 600,
      color: colors.neutral[900],
      marginBottom: '4px',
    },
    providerDescription: {
      ...typography.caption,
      color: colors.neutral[600],
    },
    comingSoon: {
      ...typography.caption,
      color: colors.warning[700],
      backgroundColor: colors.warning[50],
      padding: '2px 8px',
      borderRadius: '8px',
      display: 'inline-block',
      marginTop: '8px',
    },
    button: {
      ...typography.button,
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
    },
    dangerButton: {
      backgroundColor: colors.danger[600],
      color: colors.white,
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

  const isConnected = profile?.crm_connected;
  const provider = profile?.crm_provider;

  const providers = [
    {
      id: 'salesforce',
      name: 'Salesforce',
      logo: '☁️',
      description: 'Industry-leading CRM',
      available: true,
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      logo: '🟠',
      description: 'All-in-one CRM platform',
      available: false,
    },
    {
      id: 'pipedrive',
      name: 'Pipedrive',
      logo: '🔵',
      description: 'Sales-focused CRM',
      available: false,
    },
  ];

  return (
    <SettingsSection
      title="CRM Integration"
      description="Connect your CRM to automatically sync contacts and activities"
    >
      <div style={styles.status}>
        <div style={{
          ...styles.statusIcon,
          ...(isConnected ? styles.connectedIcon : styles.disconnectedIcon),
        }}>
          {isConnected ? '✓' : '○'}
        </div>
        <div style={styles.statusInfo}>
          <div style={styles.statusTitle}>
            {isConnected ? `Connected to ${provider}` : 'Not Connected'}
          </div>
          <div style={styles.statusDescription}>
            {isConnected
              ? 'Your recordings will be automatically synced'
              : 'Connect a CRM to start syncing data'}
          </div>
        </div>
        <span style={{
          ...styles.badge,
          ...(isConnected ? styles.connectedBadge : styles.disconnectedBadge),
        }}>
          {isConnected ? 'Active' : 'Inactive'}
        </span>
      </div>

      {!isConnected ? (
        <>
          <div style={{ ...typography.bodySmall, color: colors.neutral[700], marginBottom: '12px' }}>
            Choose a CRM to connect:
          </div>
          <div style={styles.providers}>
            {providers.map((p) => (
              <div
                key={p.id}
                onClick={() => p.available && handleConnect(p.id)}
                style={{
                  ...styles.providerCard,
                  ...(p.available ? {} : { opacity: 0.6, cursor: 'not-allowed' }),
                }}
              >
                <div style={styles.providerLogo}>{p.logo}</div>
                <div style={styles.providerName}>{p.name}</div>
                <div style={styles.providerDescription}>{p.description}</div>
                {!p.available && <div style={styles.comingSoon}>Coming Soon</div>}
              </div>
            ))}
          </div>
        </>
      ) : (
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          style={{ ...styles.button, ...styles.dangerButton }}
        >
          {disconnecting ? 'Disconnecting...' : 'Disconnect CRM'}
        </button>
      )}

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
    </SettingsSection>
  );
}

export default CRMSection;
