/**
 * Salesforce CRM Integration Service
 * Handles OAuth authentication and API interactions
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
 * Initiate Salesforce OAuth flow
 */
export const initiateSalesforceAuth = () => {
  console.log('[Salesforce] Initiating OAuth flow');

  // Generate state for CSRF protection
  const state = Math.random().toString(36).substring(7);
  sessionStorage.setItem('salesforce_oauth_state', state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SALESFORCE_CONFIG.clientId,
    redirect_uri: SALESFORCE_CONFIG.redirectUri,
    state: state,
    scope: SALESFORCE_CONFIG.scope,
    prompt: 'login',
  });

  const authUrl = `${SALESFORCE_CONFIG.authUrl}?${params.toString()}`;
  console.log('[Salesforce] Redirecting to:', authUrl);

  // Redirect to Salesforce login
  window.location.href = authUrl;
};

/**
 * Handle OAuth callback and exchange code for tokens
 */
export const handleSalesforceCallback = async (code, state) => {
  console.log('[Salesforce] Handling OAuth callback');

  try {
    // Verify state for CSRF protection
    const savedState = sessionStorage.getItem('salesforce_oauth_state');
    if (state !== savedState) {
      throw new Error('Invalid state parameter - possible CSRF attack');
    }
    sessionStorage.removeItem('salesforce_oauth_state');

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(SALESFORCE_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: SALESFORCE_CONFIG.clientId,
        client_secret: SALESFORCE_CONFIG.clientSecret,
        redirect_uri: SALESFORCE_CONFIG.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('[Salesforce] Token exchange failed:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }

    const tokens = await tokenResponse.json();
    console.log('[Salesforce] Tokens received');

    // Get user info
    const userInfoResponse = await fetch(tokens.id, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch Salesforce user info');
    }

    const userInfo = await userInfoResponse.json();
    console.log('[Salesforce] User info:', userInfo);

    // Store tokens in database
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        crm_provider: 'salesforce',
        crm_connected: true,
        crm_access_token: tokens.access_token, // TODO: Encrypt in production
        crm_refresh_token: tokens.refresh_token, // TODO: Encrypt in production
        crm_user_id: userInfo.user_id,
        settings: {
          salesforce_instance_url: tokens.instance_url,
        },
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    console.log('[Salesforce] Connection saved successfully');
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
