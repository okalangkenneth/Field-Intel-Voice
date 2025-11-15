import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { typography, colors } from '../styles/index.js';
import { handleSalesforceCallback } from '../services/crm/salesforce.js';

function SalesforceCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Connecting to Salesforce...');
  const processingRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate processing (React StrictMode runs effects twice)
    if (processingRef.current) {
      console.log('[SalesforceCallback] Already processing, skipping duplicate');
      return;
    }
    processingRef.current = true;

    const processCallback = async () => {
      console.log('[SalesforceCallback] Processing OAuth callback');

      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Handle OAuth errors
      if (error) {
        console.error('[SalesforceCallback] OAuth error:', error, errorDescription);
        setStatus('error');
        setMessage(errorDescription || 'Failed to connect to Salesforce');
        setTimeout(() => navigate('/settings'), 3000);
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        console.error('[SalesforceCallback] Missing code or state parameter');
        setStatus('error');
        setMessage('Invalid OAuth callback - missing parameters');
        setTimeout(() => navigate('/settings'), 3000);
        return;
      }

      // Exchange code for tokens
      const result = await handleSalesforceCallback(code, state);

      if (result.error) {
        // Ignore "duplicate callback" errors from React StrictMode
        if (result.error.includes('Duplicate callback')) {
          console.log('[SalesforceCallback] Ignoring duplicate callback error');
          setStatus('success');
          setMessage('Successfully connected to Salesforce!');
          setTimeout(() => navigate('/settings'), 2000);
        } else {
          setStatus('error');
          setMessage(result.error);
          setTimeout(() => navigate('/settings'), 3000);
        }
      } else {
        setStatus('success');
        setMessage('Successfully connected to Salesforce!');
        setTimeout(() => navigate('/settings'), 2000);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.primary[100]} 100%)`,
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: '16px',
      padding: '40px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      textAlign: 'center',
      maxWidth: '400px',
    },
    icon: {
      fontSize: '48px',
      marginBottom: '20px',
    },
    title: {
      ...typography.h2,
      color: colors.neutral[900],
      marginBottom: '12px',
    },
    message: {
      ...typography.body,
      color: colors.neutral[600],
      marginBottom: '20px',
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: `4px solid ${colors.neutral[200]}`,
      borderTop: `4px solid ${colors.primary[600]}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 20px',
    },
  };

  const getIcon = () => {
    if (status === 'processing') return '⏳';
    if (status === 'success') return '✅';
    if (status === 'error') return '❌';
    return '🔄';
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={styles.card}>
        {status === 'processing' && <div style={styles.spinner} />}
        <div style={styles.icon}>{getIcon()}</div>
        <h2 style={styles.title}>
          {status === 'processing' && 'Connecting...'}
          {status === 'success' && 'Connected!'}
          {status === 'error' && 'Connection Failed'}
        </h2>
        <p style={styles.message}>{message}</p>
        {(status === 'success' || status === 'error') && (
          <p style={{ ...typography.caption, color: colors.neutral[500] }}>
            Redirecting to settings...
          </p>
        )}
      </div>
    </div>
  );
}

export default SalesforceCallback;
