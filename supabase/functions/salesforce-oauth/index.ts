/**
 * Salesforce OAuth Token Exchange Edge Function
 *
 * This function runs server-side to exchange the authorization code for tokens.
 * This is necessary because Salesforce doesn't allow browser-side token exchanges (CORS restriction).
 *
 * Environment variables required:
 * - VITE_SALESFORCE_CLIENT_ID
 * - VITE_SALESFORCE_CLIENT_SECRET
 */

// @deno-types="https://esm.sh/@supabase/supabase-js@2.7.1"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization code and code verifier from request
    const { code, codeVerifier, redirectUri } = await req.json();

    if (!code || !codeVerifier || !redirectUri) {
      throw new Error('Missing required parameters: code, codeVerifier, or redirectUri');
    }

    console.log('[Salesforce OAuth] Exchanging authorization code for tokens');
    console.log('[Salesforce OAuth] Code:', code.substring(0, 20) + '...');
    console.log('[Salesforce OAuth] Code verifier:', codeVerifier.substring(0, 20) + '...');
    console.log('[Salesforce OAuth] Code verifier length:', codeVerifier.length);
    console.log('[Salesforce OAuth] Redirect URI:', redirectUri);

    // Get Salesforce credentials from environment
    // Note: Supabase Edge Functions use plain env var names (no VITE_ prefix)
    const clientId = Deno.env.get('SALESFORCE_CLIENT_ID');
    const clientSecret = Deno.env.get('SALESFORCE_CLIENT_SECRET');

    console.log('[Salesforce OAuth] Environment check:');
    console.log('[Salesforce OAuth]   - Client ID present:', !!clientId);
    console.log('[Salesforce OAuth]   - Client ID (first 20):', clientId?.substring(0, 20) + '...');
    console.log('[Salesforce OAuth]   - Client Secret present:', !!clientSecret);

    if (!clientId || !clientSecret) {
      console.error('[Salesforce OAuth] Missing credentials in Edge Function environment');
      throw new Error('Salesforce credentials not configured in Edge Function. Please set SALESFORCE_CLIENT_ID and SALESFORCE_CLIENT_SECRET secrets.');
    }

    // CRITICAL: Verify the code_verifier by regenerating the challenge
    console.log('[Salesforce OAuth] Verifying code_verifier integrity in Edge Function...');
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);

      // Base64url encode
      const hashArray = new Uint8Array(hashBuffer);
      let binary = '';
      for (let i = 0; i < hashArray.length; i++) {
        binary += String.fromCharCode(hashArray[i]);
      }
      const base64 = btoa(binary);
      const challenge = base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      console.log('[Salesforce OAuth]   - Regenerated challenge:', challenge);
      console.log('[Salesforce OAuth]   - This should match the challenge sent in authorization request');
    } catch (err) {
      console.error('[Salesforce OAuth] Failed to verify code_verifier:', err);
    }

    // Exchange authorization code for tokens
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    console.log('[Salesforce OAuth] Token exchange request:');
    console.log('[Salesforce OAuth]   - URL:', 'https://login.salesforce.com/services/oauth2/token');
    console.log('[Salesforce OAuth]   - grant_type:', 'authorization_code');
    console.log('[Salesforce OAuth]   - code:', code.substring(0, 20) + '...');
    console.log('[Salesforce OAuth]   - client_id:', clientId);
    console.log('[Salesforce OAuth]   - redirect_uri:', redirectUri);
    console.log('[Salesforce OAuth]   - code_verifier length:', codeVerifier.length);
    console.log('[Salesforce OAuth]   - code_verifier (raw):', codeVerifier);
    console.log('[Salesforce OAuth]   - code_verifier (first 30):', codeVerifier.substring(0, 30));
    console.log('[Salesforce OAuth]   - code_verifier (last 30):', codeVerifier.substring(codeVerifier.length - 30));
    console.log('[Salesforce OAuth]   - Full request body:', tokenParams.toString());

    const tokenResponse = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Salesforce OAuth] Token exchange failed');
      console.error('[Salesforce OAuth] Status:', tokenResponse.status);
      console.error('[Salesforce OAuth] Error:', errorText);

      // Try to parse as JSON for better error details
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = { error: errorText };
      }

      throw new Error(`Token exchange failed: ${JSON.stringify(errorDetails)}`);
    }

    const tokens = await tokenResponse.json();
    console.log('[Salesforce OAuth] Tokens received');

    // Get Salesforce user info
    const userInfoResponse = await fetch(tokens.id, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch Salesforce user info');
    }

    const userInfo = await userInfoResponse.json();
    console.log('[Salesforce OAuth] User info retrieved');

    // Get authenticated user from Supabase
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[Salesforce OAuth] Missing authorization header');
      throw new Error('Missing authorization header');
    }

    console.log('[Salesforce OAuth] Auth header present:', !!authHeader);
    console.log('[Salesforce OAuth] Auth header (first 30):', authHeader.substring(0, 30) + '...');

    // Extract JWT token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');

    console.log('[Salesforce OAuth] Extracted token (first 30):', token.substring(0, 30) + '...');

    // Create Supabase client with service role key to access auth admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify the user's JWT token and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    console.log('[Salesforce OAuth] User verification result:');
    console.log('[Salesforce OAuth]   - Has user:', !!user);
    console.log('[Salesforce OAuth]   - Has error:', !!userError);

    if (userError) {
      console.error('[Salesforce OAuth] User verification failed:', userError);
      throw userError;
    }
    if (!user) {
      console.error('[Salesforce OAuth] No user found in token');
      throw new Error('User not authenticated');
    }

    console.log('[Salesforce OAuth] User authenticated:', user.id);

    // Store tokens in database (using admin client for database operations)
    const { error: updateError } = await supabaseAdmin
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

    if (updateError) {
      console.error('[Salesforce OAuth] Database update failed:', updateError);
      throw updateError;
    }

    console.log('[Salesforce OAuth] Connection saved successfully');

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          name: userInfo.display_name,
          email: userInfo.email,
          organization: userInfo.organization_id,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[Salesforce OAuth] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
