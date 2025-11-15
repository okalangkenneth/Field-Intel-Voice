/**
 * CRM Sync Edge Function
 *
 * Syncs analysis results (contacts, action items) to connected CRM (Salesforce)
 *
 * Input:
 *   - analysisId: ID of the analysis_results record
 *   - recordingId: ID of the recording (for logging)
 *
 * Output:
 *   - success: boolean
 *   - synced: { contacts: number, tasks: number }
 *   - error: string (if failed)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  analysisId: string;
  recordingId: string;
}

interface SalesforceContact {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  confidence?: number;
}

interface SalesforceTask {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[CRM Sync] Function invoked');

    // Parse request
    const { analysisId, recordingId }: SyncRequest = await req.json();

    if (!analysisId || !recordingId) {
      throw new Error('Missing required fields: analysisId, recordingId');
    }

    console.log('[CRM Sync] Processing:', { analysisId, recordingId });

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get analysis results from database
    console.log('[CRM Sync] Fetching analysis results');
    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from('analysis_results')
      .select('*, recordings(user_id)')
      .eq('id', analysisId)
      .single();

    if (analysisError || !analysis) {
      console.error('[CRM Sync] Analysis not found:', analysisError);
      throw new Error('Analysis results not found');
    }

    const userId = analysis.recordings?.user_id;
    if (!userId) {
      throw new Error('User ID not found in analysis');
    }

    console.log('[CRM Sync] Analysis found for user:', userId);

    // Get user's CRM credentials
    console.log('[CRM Sync] Fetching CRM credentials');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('crm_provider, crm_connected, crm_access_token, crm_refresh_token, settings')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('[CRM Sync] Profile not found:', profileError);
      throw new Error('User profile not found');
    }

    // Check if CRM is connected
    if (!profile.crm_connected || !profile.crm_access_token) {
      console.log('[CRM Sync] CRM not connected for user');

      // Log as skipped
      await supabaseAdmin.from('crm_sync_logs').insert({
        user_id: userId,
        recording_id: recordingId,
        provider: profile.crm_provider || 'none',
        status: 'skipped',
        error_message: 'CRM not connected',
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'CRM not connected',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, // Not an error, just skipped
        }
      );
    }

    console.log('[CRM Sync] CRM provider:', profile.crm_provider);

    // Currently only Salesforce is supported
    if (profile.crm_provider !== 'salesforce') {
      throw new Error(`CRM provider '${profile.crm_provider}' not yet supported`);
    }

    // Get Salesforce instance URL
    const salesforceInstanceUrl = profile.settings?.salesforce_instance_url;
    if (!salesforceInstanceUrl) {
      throw new Error('Salesforce instance URL not found');
    }

    console.log('[CRM Sync] Salesforce instance:', salesforceInstanceUrl);

    // Extract contacts and action items from analysis
    const contacts: SalesforceContact[] = analysis.contacts || [];
    const actionItems: SalesforceTask[] = analysis.action_items || [];

    console.log('[CRM Sync] Data to sync:', {
      contacts: contacts.length,
      actionItems: actionItems.length,
    });

    // Sync to Salesforce
    const syncedContacts: any[] = [];
    const syncedTasks: any[] = [];
    const errors: string[] = [];

    // Sync contacts
    for (const contact of contacts) {
      try {
        const result = await syncContactToSalesforce(
          contact,
          profile.crm_access_token,
          salesforceInstanceUrl
        );
        syncedContacts.push(result);
        console.log('[CRM Sync] Contact synced:', result.id);
      } catch (error) {
        const errorMsg = `Failed to sync contact ${contact.name}: ${error.message}`;
        console.error('[CRM Sync]', errorMsg);
        errors.push(errorMsg);
      }
    }

    // Sync action items as tasks
    for (const actionItem of actionItems) {
      try {
        // Link to first synced contact if available
        const contactId = syncedContacts[0]?.id;

        const result = await syncTaskToSalesforce(
          actionItem,
          contactId,
          profile.crm_access_token,
          salesforceInstanceUrl
        );
        syncedTasks.push(result);
        console.log('[CRM Sync] Task synced:', result.id);
      } catch (error) {
        const errorMsg = `Failed to sync task ${actionItem.title}: ${error.message}`;
        console.error('[CRM Sync]', errorMsg);
        errors.push(errorMsg);
      }
    }

    // Determine overall status
    const hasErrors = errors.length > 0;
    const allFailed = syncedContacts.length === 0 && syncedTasks.length === 0 && (contacts.length > 0 || actionItems.length > 0);
    const status = allFailed ? 'failed' : hasErrors ? 'partial' : 'completed';

    // Log sync result to database
    console.log('[CRM Sync] Logging sync result:', status);
    const { error: logError } = await supabaseAdmin
      .from('crm_sync_logs')
      .insert({
        user_id: userId,
        recording_id: recordingId,
        provider: 'salesforce',
        status: status,
        synced_data: {
          contacts: syncedContacts.length,
          tasks: syncedTasks.length,
          contactIds: syncedContacts.map(c => c.id),
          taskIds: syncedTasks.map(t => t.id),
        },
        error_message: errors.length > 0 ? errors.join('; ') : null,
      });

    if (logError) {
      console.error('[CRM Sync] Failed to log sync:', logError);
    }

    // Update recording status
    if (status === 'completed') {
      await supabaseAdmin
        .from('recordings')
        .update({ status: 'synced' })
        .eq('id', recordingId);
    }

    console.log('[CRM Sync] Sync completed:', {
      status,
      contacts: syncedContacts.length,
      tasks: syncedTasks.length,
      errors: errors.length,
    });

    return new Response(
      JSON.stringify({
        success: status !== 'failed',
        status,
        synced: {
          contacts: syncedContacts.length,
          tasks: syncedTasks.length,
        },
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[CRM Sync] Error:', error);

    // Try to log the error
    try {
      const body = await req.json().catch(() => ({}));
      if (body.recordingId) {
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Get user_id from recording
        const { data: recording } = await supabaseAdmin
          .from('recordings')
          .select('user_id')
          .eq('id', body.recordingId)
          .single();

        if (recording) {
          await supabaseAdmin.from('crm_sync_logs').insert({
            user_id: recording.user_id,
            recording_id: body.recordingId,
            provider: 'salesforce',
            status: 'failed',
            error_message: error.message,
          });
        }
      }
    } catch (logError) {
      console.error('[CRM Sync] Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'CRM sync failed',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Sync a contact to Salesforce
 * Creates new contact or updates existing one (matched by email)
 */
async function syncContactToSalesforce(
  contact: SalesforceContact,
  accessToken: string,
  instanceUrl: string
): Promise<any> {
  console.log('[CRM Sync] Syncing contact:', contact.name);

  // Salesforce requires at least LastName
  const nameParts = contact.name?.split(' ') || [];
  const firstName = nameParts.slice(0, -1).join(' ') || '';
  const lastName = nameParts[nameParts.length - 1] || contact.name || 'Unknown';

  // Prepare contact data
  const contactData: any = {
    FirstName: firstName || undefined,
    LastName: lastName,
  };

  if (contact.email) contactData.Email = contact.email;
  if (contact.phone) contactData.Phone = contact.phone;
  if (contact.title) contactData.Title = contact.title;
  if (contact.company) contactData.Account = { Name: contact.company }; // This might need adjustment

  // Add description with confidence score
  if (contact.confidence) {
    contactData.Description = `Extracted from voice recording. Confidence: ${Math.round(contact.confidence * 100)}%`;
  }

  // If we have an email, try to find existing contact
  let existingContactId = null;
  if (contact.email) {
    try {
      const searchQuery = `SELECT Id FROM Contact WHERE Email = '${contact.email}' LIMIT 1`;
      const searchUrl = `${instanceUrl}/services/data/v58.0/query?q=${encodeURIComponent(searchQuery)}`;

      const searchResponse = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (searchResponse.ok) {
        const searchResult = await searchResponse.json();
        if (searchResult.records && searchResult.records.length > 0) {
          existingContactId = searchResult.records[0].Id;
          console.log('[CRM Sync] Found existing contact:', existingContactId);
        }
      }
    } catch (searchError) {
      console.log('[CRM Sync] Search failed, will create new contact:', searchError.message);
    }
  }

  // Update existing or create new contact
  if (existingContactId) {
    // Update existing contact
    const updateUrl = `${instanceUrl}/services/data/v58.0/sobjects/Contact/${existingContactId}`;

    const response = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update contact: ${errorText}`);
    }

    return { id: existingContactId, action: 'updated' };

  } else {
    // Create new contact
    const createUrl = `${instanceUrl}/services/data/v58.0/sobjects/Contact`;

    const response = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create contact: ${errorText}`);
    }

    const result = await response.json();
    return { id: result.id, action: 'created' };
  }
}

/**
 * Sync a task/action item to Salesforce
 */
async function syncTaskToSalesforce(
  task: SalesforceTask,
  contactId: string | undefined,
  accessToken: string,
  instanceUrl: string
): Promise<any> {
  console.log('[CRM Sync] Syncing task:', task.title);

  // Map priority
  const priorityMap: { [key: string]: string } = {
    'low': 'Low',
    'medium': 'Normal',
    'high': 'High',
    'urgent': 'High',
  };

  const taskData: any = {
    Subject: task.title || 'Follow-up from voice recording',
    Description: task.description || '',
    Status: 'Not Started',
    Priority: priorityMap[task.priority || 'medium'] || 'Normal',
  };

  // Add due date if provided
  if (task.due_date) {
    taskData.ActivityDate = task.due_date;
  }

  // Link to contact if available
  if (contactId) {
    taskData.WhoId = contactId;
  }

  // Create task
  const createUrl = `${instanceUrl}/services/data/v58.0/sobjects/Task`;

  const response = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create task: ${errorText}`);
  }

  const result = await response.json();
  return { id: result.id, action: 'created' };
}
