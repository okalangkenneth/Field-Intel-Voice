/**
 * Salesforce CRM Integration Service
 * Handles OAuth authentication and API interactions
 *
 * SETUP REQUIRED IN SALESFORCE:
 * 1. Create an External Client App (not a Connected App) in Salesforce Setup
 * 2. Enable OAuth Settings with Web Server flow
 * 3. Set redirect URI to match SALESFORCE_CONFIG.redirectUri below
 * 4. Select OAuth scopes: api, refresh_token, offline_access
 * 5. Create a Permission Set and grant access to the External Client App
 * 6. Assign the Permission Set to users who need Field Intel access
 * 7. Copy the Client ID and Client Secret to your .env file
 *
 * Note: External Client Apps are more secure than Connected Apps (secure-by-default)
 * and are Salesforce's recommended approach for new integrations.
 */

import { supabase } from '../../lib/supabase.js';

// Salesforce OAuth configuration
const SALESFORCE_CONFIG = {
  clientId: import.meta.env.VITE_SALESFORCE_CLIENT_ID,
  clientSecret: import.meta.env.VITE_SALESFORCE_CLIENT_SECRET,
  redirectUri: `${window.location.origin}/settings/crm/callback/salesforce`,
  authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
  tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
  scope: 'api refresh_token offline_access',
};

/**
 * Generate PKCE code verifier and challenge
 * PKCE (Proof Key for Code Exchange) is required by Salesforce for security
 */
const generatePKCE = async () => {
  // Generate code verifier (random string)
  const verifier = generateRandomString(128);

  // Generate code challenge (SHA-256 hash of verifier, base64url encoded)
  const challenge = await generateCodeChallenge(verifier);

  return { verifier, challenge };
};

const generateRandomString = (length) => {
  // RFC 7636 allows: [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
  // But ~ gets URL-encoded to %7E by URLSearchParams, which can cause issues
  // Using only characters that don't get URL-encoded for maximum compatibility
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }

  return result;
};

const generateCodeChallenge = async (verifier) => {
  // SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);

  // Base64url encode
  return base64UrlEncode(hash);
};

const base64UrlEncode = (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

/**
 * Initiate Salesforce OAuth flow with PKCE
 */
export const initiateSalesforceAuth = async () => {
  try {
    console.log('[Salesforce] Step 1: Starting OAuth flow');

    // Generate PKCE parameters first
    console.log('[Salesforce] Step 2: Generating PKCE parameters...');
    const { verifier, challenge } = await generatePKCE();
    console.log('[Salesforce] Step 3: PKCE generated');
    console.log('[Salesforce]   - Verifier length:', verifier.length);
    console.log('[Salesforce]   - Challenge:', challenge);

    // Generate state for CSRF protection and encode verifier + challenge in it
    const stateData = {
      random: Math.random().toString(36).substring(7),
      verifier: verifier,
      challenge: challenge,
      timestamp: Date.now(),
    };

    // Base64url encode the state data (to keep it URL-safe)
    const stateJson = JSON.stringify(stateData);
    const stateEncoded = btoa(stateJson)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    console.log('[Salesforce] Step 4: State encoded with verifier');
    console.log('[Salesforce]   - State length:', stateEncoded.length);

    // Also store in sessionStorage as backup (more reliable than localStorage during redirects)
    sessionStorage.setItem('salesforce_oauth_state', stateData.random);
    sessionStorage.setItem('salesforce_code_verifier', verifier);
    console.log('[Salesforce] Step 5: Backup stored in sessionStorage');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: SALESFORCE_CONFIG.clientId,
      redirect_uri: SALESFORCE_CONFIG.redirectUri,
      state: stateEncoded,
      scope: SALESFORCE_CONFIG.scope,
      prompt: 'login',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    const authUrl = `${SALESFORCE_CONFIG.authUrl}?${params.toString()}`;
    console.log('[Salesforce] Step 6: Redirecting to:', authUrl);

    // Redirect to Salesforce login
    window.location.href = authUrl;
  } catch (error) {
    console.error('[Salesforce] ERROR initiating OAuth:', error);
    throw error;
  }
};

/**
 * Handle OAuth callback and exchange code for tokens (with PKCE)
 */
export const handleSalesforceCallback = async (code, state) => {
  console.log('[Salesforce] Handling OAuth callback');
  console.log('[Salesforce]   - Code received:', code.substring(0, 20) + '...');
  console.log('[Salesforce]   - State received:', state.substring(0, 50) + '...');

  try {
    // Decode state to extract verifier and random token
    let stateData;
    let codeVerifier;

    try {
      // Decode base64url state
      const stateJson = atob(
        state
          .replace(/-/g, '+')
          .replace(/_/g, '/')
      );
      stateData = JSON.parse(stateJson);

      console.log('[Salesforce] State decoded successfully');
      console.log('[Salesforce]   - Random token:', stateData.random);
      console.log('[Salesforce]   - Timestamp:', new Date(stateData.timestamp).toISOString());
      console.log('[Salesforce]   - Verifier from state:', stateData.verifier.substring(0, 20) + '...');

      // Verify state hasn't expired (10 minutes max)
      const stateAge = Date.now() - stateData.timestamp;
      if (stateAge > 10 * 60 * 1000) {
        throw new Error('OAuth state expired - please try again');
      }

      // Extract verifier from state
      codeVerifier = stateData.verifier;

      // Verify against sessionStorage backup for extra security
      const savedState = sessionStorage.getItem('salesforce_oauth_state');
      if (savedState && savedState !== stateData.random) {
        console.error('[Salesforce] State mismatch. Expected:', savedState, 'Got:', stateData.random);
        throw new Error('Invalid state parameter - possible CSRF attack');
      }

      console.log('[Salesforce] State validation passed');
    } catch (decodeError) {
      console.error('[Salesforce] Failed to decode state, trying sessionStorage fallback:', decodeError);

      // Fallback to sessionStorage (for backwards compatibility or if state encoding fails)
      const savedState = sessionStorage.getItem('salesforce_oauth_state');
      codeVerifier = sessionStorage.getItem('salesforce_code_verifier');

      if (!codeVerifier) {
        throw new Error('Code verifier not found - possible session issue or expired state');
      }

      console.log('[Salesforce] Using verifier from sessionStorage fallback');
    }

    if (!codeVerifier) {
      throw new Error('Code verifier not found - unable to complete OAuth');
    }

    console.log('[Salesforce] Retrieved code verifier');
    console.log('[Salesforce]   - Verifier length:', codeVerifier.length);
    console.log('[Salesforce]   - Verifier (first 30 chars):', codeVerifier.substring(0, 30) + '...');

    // Clean up session storage
    sessionStorage.removeItem('salesforce_oauth_state');
    sessionStorage.removeItem('salesforce_code_verifier');
    console.log('[Salesforce] Session storage cleaned up');

    // Get current user session for authorization
    // After OAuth redirect, session might not be immediately available, so retry
    console.log('[Salesforce] Getting Supabase session...');
    let session = null;
    let sessionError = null;

    // Try to get session with retries (OAuth redirect timing issue)
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log('[Salesforce] Session attempt', attempt);
      const result = await supabase.auth.getSession();

      console.log('[Salesforce] Session result:', {
        hasSession: !!result.data?.session,
        hasError: !!result.error,
        sessionData: result.data,
        error: result.error
      });

      if (result.data?.session) {
        session = result.data.session;
        console.log('[Salesforce] Session found on attempt', attempt);
        console.log('[Salesforce]   - User ID:', session.user.id);
        console.log('[Salesforce]   - Access token present:', !!session.access_token);
        console.log('[Salesforce]   - Access token (first 30):', session.access_token?.substring(0, 30) + '...');
        break;
      }

      if (result.error) {
        sessionError = result.error;
        console.error('[Salesforce] Session error on attempt', attempt, ':', result.error);
      } else {
        console.log('[Salesforce] No session on attempt', attempt, '- will retry...');
      }

      // Wait before retry (exponential backoff)
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, attempt * 500));
      }
    }

    if (sessionError) {
      console.error('[Salesforce] Session error after all retries:', sessionError);
      throw sessionError;
    }

    if (!session) {
      console.error('[Salesforce] No session found after all retries - user not authenticated');
      throw new Error('Not authenticated - please log in again');
    }

    console.log('[Salesforce] Session found, user ID:', session.user.id);
    console.log('[Salesforce] Access token:', session.access_token.substring(0, 20) + '...');

    // Verify the code_verifier by regenerating the challenge
    console.log('[Salesforce] Verifying code_verifier integrity...');
    try {
      const regeneratedChallenge = await generateCodeChallenge(codeVerifier);
      const originalChallenge = stateData?.challenge;

      console.log('[Salesforce] Verification complete:');
      console.log('[Salesforce]   - Code verifier length:', codeVerifier.length);
      console.log('[Salesforce]   - Regenerated challenge:', regeneratedChallenge);
      console.log('[Salesforce]   - Original challenge:', originalChallenge || 'not stored');

      if (originalChallenge && regeneratedChallenge === originalChallenge) {
        console.log('[Salesforce]   ✅ VERIFICATION PASSED: Challenges match!');
      } else if (originalChallenge) {
        console.error('[Salesforce]   ❌ VERIFICATION FAILED: Challenges DO NOT match!');
        console.error('[Salesforce]   This means the verifier was corrupted during transmission');
        throw new Error('Code verifier verification failed - verifier was corrupted');
      }
    } catch (verifyError) {
      console.error('[Salesforce] WARNING: Code verifier verification failed:', verifyError);
      console.error('[Salesforce]   This may indicate the verifier was corrupted during transmission');
      throw verifyError; // Fail early if verification fails
    }

    // Call Edge Function to exchange code for tokens (server-side to avoid CORS)
    const edgeFunctionUrl = `${import.meta.env.VITE_API_BASE_URL}/salesforce-oauth`;

    console.log('[Salesforce] Calling Edge Function:', edgeFunctionUrl);
    console.log('[Salesforce] Sending params to Edge Function:');
    console.log('[Salesforce]   - code (first 20):', code.substring(0, 20) + '...');
    console.log('[Salesforce]   - code (full length):', code.length);
    console.log('[Salesforce]   - codeVerifier (first 30):', codeVerifier.substring(0, 30) + '...');
    console.log('[Salesforce]   - codeVerifier (full length):', codeVerifier.length);
    console.log('[Salesforce]   - codeVerifier (last 30):', '...' + codeVerifier.substring(codeVerifier.length - 30));
    console.log('[Salesforce]   - redirectUri:', SALESFORCE_CONFIG.redirectUri);

    const tokenResponse = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        code: code,
        codeVerifier: codeVerifier,
        redirectUri: SALESFORCE_CONFIG.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Salesforce] Token exchange failed');
      console.error('[Salesforce]   - Status:', tokenResponse.status);
      console.error('[Salesforce]   - Status text:', tokenResponse.statusText);
      console.error('[Salesforce]   - Response text:', errorText);

      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText };
      }

      console.error('[Salesforce]   - Parsed error:', error);
      throw new Error(error.error || error.message || 'Failed to exchange authorization code for tokens');
    }

    const result = await tokenResponse.json();
    console.log('[Salesforce] OAuth completed successfully');

    return { success: true, error: null };
  } catch (error) {
    console.error('[Salesforce] OAuth callback error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Refresh Salesforce access token
 */
export const refreshSalesforceToken = async (refreshToken) => {
  console.log('[Salesforce] Refreshing access token');

  try {
    const response = await fetch(SALESFORCE_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: SALESFORCE_CONFIG.clientId,
        client_secret: SALESFORCE_CONFIG.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const tokens = await response.json();
    console.log('[Salesforce] Token refreshed successfully');

    return { data: tokens, error: null };
  } catch (error) {
    console.error('[Salesforce] Token refresh error:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Create or update a contact in Salesforce
 */
export const syncContactToSalesforce = async (contact, accessToken, instanceUrl) => {
  console.log('[Salesforce] Syncing contact:', contact);

  try {
    // Check if contact exists by email
    const searchQuery = `SELECT Id FROM Contact WHERE Email = '${contact.email}' LIMIT 1`;
    const searchUrl = `${instanceUrl}/services/data/v58.0/query?q=${encodeURIComponent(searchQuery)}`;

    const searchResponse = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!searchResponse.ok) {
      throw new Error('Failed to search for contact');
    }

    const searchResult = await searchResponse.json();
    const existingContact = searchResult.records[0];

    // Prepare contact data
    const contactData = {
      FirstName: contact.name?.split(' ')[0] || '',
      LastName: contact.name?.split(' ').slice(1).join(' ') || contact.name || 'Unknown',
      Email: contact.email,
      Phone: contact.phone,
      Title: contact.title,
      Company: contact.company,
      Description: `Extracted from voice recording. Confidence: ${Math.round((contact.confidence || 0) * 100)}%`,
    };

    let result;

    if (existingContact) {
      // Update existing contact
      console.log('[Salesforce] Updating existing contact:', existingContact.Id);
      const updateUrl = `${instanceUrl}/services/data/v58.0/sobjects/Contact/${existingContact.Id}`;

      const updateResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.text();
        throw new Error(`Failed to update contact: ${error}`);
      }

      result = { id: existingContact.Id, action: 'updated' };
    } else {
      // Create new contact
      console.log('[Salesforce] Creating new contact');
      const createUrl = `${instanceUrl}/services/data/v58.0/sobjects/Contact`;

      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      if (!createResponse.ok) {
        const error = await createResponse.text();
        throw new Error(`Failed to create contact: ${error}`);
      }

      const createResult = await createResponse.json();
      result = { id: createResult.id, action: 'created' };
    }

    console.log('[Salesforce] Contact synced:', result);
    return { data: result, error: null };
  } catch (error) {
    console.error('[Salesforce] Sync contact error:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Create a task/activity in Salesforce
 */
export const syncActivityToSalesforce = async (activity, contactId, accessToken, instanceUrl) => {
  console.log('[Salesforce] Syncing activity:', activity);

  try {
    const taskData = {
      Subject: activity.title || 'Follow-up from voice recording',
      Description: activity.description,
      Status: 'Not Started',
      Priority: activity.priority === 'high' ? 'High' : activity.priority === 'urgent' ? 'High' : 'Normal',
      ActivityDate: activity.dueDate || new Date().toISOString().split('T')[0],
      WhoId: contactId, // Link to contact
    };

    const createUrl = `${instanceUrl}/services/data/v58.0/sobjects/Task`;

    const response = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create task: ${error}`);
    }

    const result = await response.json();
    console.log('[Salesforce] Activity synced:', result);

    return { data: result, error: null };
  } catch (error) {
    console.error('[Salesforce] Sync activity error:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Sync recording analysis results to Salesforce
 */
export const syncAnalysisToSalesforce = async (analysisId) => {
  console.log('[Salesforce] Syncing analysis to Salesforce:', analysisId);

  try {
    // Get user's Salesforce credentials
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('crm_access_token, crm_refresh_token, settings')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    if (!profile.crm_access_token) {
      throw new Error('Salesforce not connected');
    }

    const instanceUrl = profile.settings?.salesforce_instance_url;
    if (!instanceUrl) {
      throw new Error('Salesforce instance URL not found');
    }

    // Get analysis results
    const { data: analysis, error: analysisError } = await supabase
      .from('analysis_results')
      .select('*, recording_id')
      .eq('id', analysisId)
      .single();

    if (analysisError) throw analysisError;

    const contacts = analysis.contacts || [];
    const actionItems = analysis.action_items || [];

    // Sync contacts
    const syncedContacts = [];
    for (const contact of contacts) {
      if (contact.email) {
        const result = await syncContactToSalesforce(
          contact,
          profile.crm_access_token,
          instanceUrl
        );

        if (result.error) {
          console.error('[Salesforce] Failed to sync contact:', result.error);
        } else {
          syncedContacts.push(result.data);
        }
      }
    }

    // Sync action items as tasks
    const syncedTasks = [];
    for (const actionItem of actionItems) {
      // Link to first contact if available
      const contactId = syncedContacts[0]?.id;

      if (contactId) {
        const result = await syncActivityToSalesforce(
          actionItem,
          contactId,
          profile.crm_access_token,
          instanceUrl
        );

        if (result.error) {
          console.error('[Salesforce] Failed to sync activity:', result.error);
        } else {
          syncedTasks.push(result.data);
        }
      }
    }

    // Log sync result
    const { error: logError } = await supabase
      .from('crm_sync_logs')
      .insert({
        user_id: user.id,
        recording_id: analysis.recording_id,
        provider: 'salesforce',
        status: 'completed',
        synced_data: {
          contacts: syncedContacts.length,
          tasks: syncedTasks.length,
        },
      });

    if (logError) {
      console.error('[Salesforce] Failed to log sync:', logError);
    }

    console.log('[Salesforce] Sync completed:', { contacts: syncedContacts.length, tasks: syncedTasks.length });
    return {
      data: {
        contacts: syncedContacts,
        tasks: syncedTasks,
      },
      error: null,
    };
  } catch (error) {
    console.error('[Salesforce] Sync analysis error:', error);

    // Log failed sync
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('crm_sync_logs')
        .insert({
          user_id: user.id,
          provider: 'salesforce',
          status: 'failed',
          error_message: error.message,
        });
    } catch (logError) {
      console.error('[Salesforce] Failed to log error:', logError);
    }

    return { data: null, error: error.message };
  }
};
