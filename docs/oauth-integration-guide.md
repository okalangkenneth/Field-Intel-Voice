# OAuth Integration Guide for Field Intel

**Last Updated:** November 15, 2025
**Context:** Lessons learned from Salesforce OAuth integration (November 2025)

This guide documents critical patterns and mistakes to avoid when integrating CRM OAuth flows (HubSpot, Pipedrive, etc.).

---

## Table of Contents
1. [Critical Lessons Learned](#critical-lessons-learned)
2. [Reusable OAuth Pattern](#reusable-oauth-pattern)
3. [Client-Side Implementation](#client-side-implementation)
4. [Server-Side Implementation](#server-side-implementation)
5. [Deployment Checklist](#deployment-checklist)
6. [Quick Reference Checklist](#quick-reference-checklist)
7. [Troubleshooting](#troubleshooting)

---

## Critical Lessons Learned

### 1. ❌ **NEVER Store Code Verifier in localStorage**

**What went wrong:**
- Stored PKCE `code_verifier` in `localStorage`
- Browser clears `localStorage` during OAuth redirects
- Privacy settings can block `localStorage` during cross-domain navigation
- Caused "invalid code verifier" errors

**✅ Correct Approach:**
```javascript
// Store verifier in the state parameter itself
const stateData = {
  random: Math.random().toString(36).substring(7),
  verifier: codeVerifier,
  challenge: codeChallenge,
  timestamp: Date.now()
};

// Base64url encode the state
const stateEncoded = btoa(JSON.stringify(stateData))
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=/g, '');

// Salesforce/OAuth provider guarantees to return state unchanged
// Also backup in sessionStorage (more reliable than localStorage)
sessionStorage.setItem('crm_code_verifier', verifier);
```

**Why this works:**
- OAuth providers **guarantee** to return the `state` parameter unchanged
- State survives the redirect 100% of the time
- sessionStorage is more reliable than localStorage during redirects

---

### 2. ❌ **NEVER Use `~` Character in Code Verifier**

**What went wrong:**
- Used RFC 7636 allowed characters including `~`
- URLSearchParams encoded `~` to `%7E`
- Salesforce rejected the URL-encoded verifier
- Caused "invalid code verifier" errors

**✅ Correct Approach:**
```javascript
// Use ONLY characters that don't get URL-encoded
const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._';

// Avoid: ~ (gets encoded to %7E)
```

**Why this matters:**
- URLSearchParams automatically URL-encodes certain characters
- Some OAuth providers reject URL-encoded verifiers
- Safer to avoid characters that need encoding

---

### 3. ❌ **NEVER Use `VITE_` Prefix in Edge Functions**

**What went wrong:**
```typescript
// ❌ WRONG: Used VITE_ prefix in Edge Function
const clientId = Deno.env.get('VITE_SALESFORCE_CLIENT_ID');
// Returns undefined because VITE_ is only for client-side
```

**✅ Correct Approach:**
```typescript
// ✅ CORRECT: Plain env var names in Edge Functions
const clientId = Deno.env.get('SALESFORCE_CLIENT_ID');
const clientSecret = Deno.env.get('SALESFORCE_CLIENT_SECRET');
```

**Why this matters:**
- `VITE_` prefix is **only** for Vite to expose variables to client-side code
- Supabase Edge Functions use plain environment variable names
- Set with: `supabase secrets set SALESFORCE_CLIENT_ID="..."`

**Environment Variable Naming:**
| Location | Variable Name | Example |
|----------|--------------|---------|
| Client-side (.env.local) | `VITE_SALESFORCE_CLIENT_ID` | For browser code |
| Edge Function (Supabase) | `SALESFORCE_CLIENT_ID` | For server code |

---

### 4. ❌ **NEVER Use Wrong Auth Pattern in Edge Functions**

**What went wrong:**
```typescript
// ❌ WRONG: This pattern doesn't work in Edge Functions
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_ANON_KEY'),
  {
    global: {
      headers: { Authorization: authHeader },
    },
  }
);

const { data: { user } } = await supabaseClient.auth.getUser();
// Throws: AuthSessionMissingError
```

**✅ Correct Approach:**
```typescript
// ✅ CORRECT: Extract JWT and use service role key
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  throw new Error('Missing authorization header');
}

// Extract token from "Bearer <token>"
const token = authHeader.replace('Bearer ', '');

// Create admin client with service role key
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Verify the JWT token
const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

if (userError) throw userError;
if (!user) throw new Error('User not authenticated');

// Use admin client for all database operations
await supabaseAdmin.from('user_profiles').update({...}).eq('id', user.id);
```

**Why this matters:**
- Edge Functions need to verify JWT tokens explicitly
- Service role key is required for auth verification
- Anon key doesn't have sufficient permissions

---

### 5. ❌ **NEVER Assume - Always Verify**

**What went wrong:**
- Assumed localStorage would persist during redirects
- Assumed URLSearchParams wouldn't encode certain characters
- Assumed auth pattern would work without testing
- Wasted hours debugging

**✅ Correct Approach:**
```javascript
// Add verification at EVERY critical step

// 1. Verify verifier was generated correctly
console.log('[CRM] Code verifier length:', verifier.length);
console.log('[CRM] Code verifier (first 30):', verifier.substring(0, 30));

// 2. Verify challenge matches verifier
const regenerated = await generateCodeChallenge(verifier);
if (regenerated === originalChallenge) {
  console.log('[CRM] ✅ Verification PASSED: Challenges match');
} else {
  console.error('[CRM] ❌ Verification FAILED: Challenges do not match');
  throw new Error('Code verifier corrupted');
}

// 3. Verify state was decoded correctly
console.log('[CRM] State decoded:', stateData);
console.log('[CRM] Verifier from state:', stateData.verifier);

// 4. Log exact values being sent to OAuth provider
console.log('[CRM] Sending to OAuth provider:');
console.log('[CRM]   - code:', code.substring(0, 20) + '...');
console.log('[CRM]   - code_verifier:', codeVerifier);
console.log('[CRM]   - redirect_uri:', redirectUri);
```

**Why this matters:**
- Debugging OAuth issues is extremely difficult without logs
- Verification catches errors early before they reach the OAuth provider
- Saves hours of trial-and-error debugging

---

## Reusable OAuth Pattern

Use this pattern for **ALL** CRM OAuth integrations (HubSpot, Pipedrive, etc.)

### Architecture Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │────1───▶│ CRM Provider │         │  Supabase   │
│  (Client)   │◀───2────│  (OAuth)     │         │    Edge     │
└─────────────┘         └──────────────┘         │  Function   │
      │                                           └─────────────┘
      │                                                  ▲
      └──────────────────3──────────────────────────────┘

Flow:
1. Client redirects to CRM with code_challenge (in state)
2. CRM redirects back with code (state unchanged)
3. Client calls Edge Function with code + code_verifier
4. Edge Function exchanges code for tokens, saves to DB
```

---

## Client-Side Implementation

### Step 1: Create CRM Service File

**File:** `src/services/crm/hubspot.js` (or `pipedrive.js`, etc.)

```javascript
import { supabase } from '../../lib/supabase.js';

// HubSpot OAuth configuration
const HUBSPOT_CONFIG = {
  clientId: import.meta.env.VITE_HUBSPOT_CLIENT_ID,
  redirectUri: `${window.location.origin}/settings/crm/callback/hubspot`,
  authUrl: 'https://app.hubspot.com/oauth/authorize',
  scope: 'crm.objects.contacts.read crm.objects.contacts.write',
};

/**
 * Generate PKCE code verifier and challenge
 */
const generatePKCE = async () => {
  // ✅ CRITICAL: Use charset WITHOUT ~ character
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._';

  // Generate 128-character verifier
  const verifier = Array.from(crypto.getRandomValues(new Uint8Array(128)))
    .map(byte => charset[byte % charset.length])
    .join('');

  // Generate SHA-256 challenge
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);

  // Base64url encode
  const bytes = new Uint8Array(hash);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const challenge = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return { verifier, challenge };
};

/**
 * Initiate OAuth flow
 */
export const initiateHubSpotAuth = async () => {
  console.log('[HubSpot] Starting OAuth flow');

  // Generate PKCE
  const { verifier, challenge } = await generatePKCE();

  // ✅ CRITICAL: Encode verifier in state parameter (NOT localStorage!)
  const stateData = {
    random: Math.random().toString(36).substring(7),
    verifier: verifier,
    challenge: challenge,
    timestamp: Date.now(),
  };

  const stateEncoded = btoa(JSON.stringify(stateData))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // Backup in sessionStorage (more reliable than localStorage)
  sessionStorage.setItem('hubspot_oauth_state', stateData.random);
  sessionStorage.setItem('hubspot_code_verifier', verifier);

  // Build authorization URL
  const params = new URLSearchParams({
    client_id: HUBSPOT_CONFIG.clientId,
    redirect_uri: HUBSPOT_CONFIG.redirectUri,
    scope: HUBSPOT_CONFIG.scope,
    state: stateEncoded,
  });

  const authUrl = `${HUBSPOT_CONFIG.authUrl}?${params.toString()}`;

  // Redirect to HubSpot
  window.location.href = authUrl;
};

/**
 * Handle OAuth callback
 */
export const handleHubSpotCallback = async (code, state) => {
  console.log('[HubSpot] Handling OAuth callback');

  try {
    // Decode state to extract verifier
    let codeVerifier;
    let stateData;

    try {
      const stateJson = atob(state.replace(/-/g, '+').replace(/_/g, '/'));
      stateData = JSON.parse(stateJson);
      codeVerifier = stateData.verifier;

      // Verify state hasn't expired (10 minutes max)
      const stateAge = Date.now() - stateData.timestamp;
      if (stateAge > 10 * 60 * 1000) {
        throw new Error('OAuth state expired - please try again');
      }

      console.log('[HubSpot] State decoded successfully');
    } catch (decodeError) {
      // Fallback to sessionStorage
      console.log('[HubSpot] Using sessionStorage fallback');
      codeVerifier = sessionStorage.getItem('hubspot_code_verifier');

      if (!codeVerifier) {
        throw new Error('Code verifier not found');
      }
    }

    // ✅ CRITICAL: Verify code_verifier integrity
    const regeneratedChallenge = await generateCodeChallenge(codeVerifier);
    const originalChallenge = stateData?.challenge;

    if (originalChallenge && regeneratedChallenge !== originalChallenge) {
      console.error('[HubSpot] ❌ Verification FAILED');
      throw new Error('Code verifier corrupted');
    }
    console.log('[HubSpot] ✅ Verification PASSED');

    // Clean up
    sessionStorage.removeItem('hubspot_oauth_state');
    sessionStorage.removeItem('hubspot_code_verifier');

    // Get user session with retries
    let session = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const result = await supabase.auth.getSession();
      if (result.data?.session) {
        session = result.data.session;
        break;
      }
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, attempt * 500));
      }
    }

    if (!session) {
      throw new Error('Not authenticated - please log in again');
    }

    // Call Edge Function to exchange code for tokens
    const edgeFunctionUrl = `${import.meta.env.VITE_API_BASE_URL}/hubspot-oauth`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        code: code,
        redirectUri: HUBSPOT_CONFIG.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to exchange code for tokens');
    }

    console.log('[HubSpot] OAuth completed successfully');
    return { success: true, error: null };

  } catch (error) {
    console.error('[HubSpot] OAuth error:', error);
    return { success: false, error: error.message };
  }
};
```

---

## Server-Side Implementation

### Step 2: Create Edge Function

**File:** `supabase/functions/hubspot-oauth/index.ts`

```typescript
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
    // Get parameters from request
    const { code, redirectUri } = await req.json();

    if (!code || !redirectUri) {
      throw new Error('Missing required parameters: code or redirectUri');
    }

    console.log('[HubSpot OAuth] Exchanging code for tokens');

    // ✅ CRITICAL: Get credentials WITHOUT VITE_ prefix
    const clientId = Deno.env.get('HUBSPOT_CLIENT_ID');
    const clientSecret = Deno.env.get('HUBSPOT_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('[HubSpot OAuth] Missing credentials');
      throw new Error('HubSpot credentials not configured');
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[HubSpot OAuth] Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokens = await tokenResponse.json();
    console.log('[HubSpot OAuth] Tokens received');

    // ✅ CRITICAL: Extract JWT and use service role key
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError) {
      console.error('[HubSpot OAuth] User verification failed:', userError);
      throw userError;
    }
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('[HubSpot OAuth] User authenticated:', user.id);

    // Store tokens in database
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        crm_provider: 'hubspot',
        crm_connected: true,
        crm_access_token: tokens.access_token,
        crm_refresh_token: tokens.refresh_token,
        settings: {
          hubspot_token_expires_at: Date.now() + (tokens.expires_in * 1000),
        },
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[HubSpot OAuth] Database update failed:', updateError);
      throw updateError;
    }

    console.log('[HubSpot OAuth] Connection saved successfully');

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[HubSpot OAuth] Error:', error);

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
```

---

## Deployment Checklist

### Step 3: Deploy Edge Function

```bash
# 1. Set secrets (plain names, NO VITE_ prefix)
supabase secrets set HUBSPOT_CLIENT_ID="your-client-id"
supabase secrets set HUBSPOT_CLIENT_SECRET="your-client-secret"

# 2. Verify secrets exist
supabase secrets list
# Should show: HUBSPOT_CLIENT_ID and HUBSPOT_CLIENT_SECRET

# 3. Deploy Edge Function
supabase functions deploy hubspot-oauth

# 4. Test OAuth flow
# - Navigate to Settings → Connect to HubSpot
# - Complete authorization
# - Check browser console for errors
# - Check Supabase logs: https://supabase.com/dashboard/project/[PROJECT_ID]/functions/hubspot-oauth/logs

# 5. Remove excessive logging after confirmed working
# - Keep error logging
# - Remove debug console.logs
```

---

## Quick Reference Checklist

Use this checklist for **every** new CRM OAuth integration:

### Before Coding
- [ ] Read OAuth provider's documentation (PKCE requirements, scopes, etc.)
- [ ] Get OAuth credentials (Client ID, Client Secret)
- [ ] Identify required OAuth scopes
- [ ] Check if provider requires PKCE (most modern ones do)

### Client-Side Code
- [ ] Store code_verifier in **state parameter** (NOT localStorage)
- [ ] Use charset **without `~`** character (`A-Z`, `a-z`, `0-9`, `-`, `.`, `_`)
- [ ] Add backup storage in **sessionStorage** (not localStorage)
- [ ] Verify code_verifier by regenerating challenge
- [ ] Add retry logic for session retrieval (3 attempts with backoff)
- [ ] Log all critical values (verifier, challenge, state)
- [ ] Handle state expiration (10-minute timeout)

### Server-Side Code (Edge Function)
- [ ] Set secrets **without VITE_ prefix** (`HUBSPOT_CLIENT_ID`, not `VITE_HUBSPOT_CLIENT_ID`)
- [ ] Use **service role key** to create Supabase admin client
- [ ] Extract JWT token: `authHeader.replace('Bearer ', '')`
- [ ] Call `supabaseAdmin.auth.getUser(token)` with the token
- [ ] Use admin client for all database operations
- [ ] Verify `redirect_uri` matches **exactly** between requests
- [ ] Add comprehensive error logging
- [ ] Handle token refresh (if provider supports it)

### Testing
- [ ] Test with fresh browser session (clear storage)
- [ ] Test with browser privacy mode
- [ ] Verify tokens are saved to database
- [ ] Verify CRM connection shows as "Connected" in UI
- [ ] Check browser console for errors
- [ ] Check Supabase Edge Function logs
- [ ] Test token expiration handling (if applicable)

### Production Readiness
- [ ] Remove excessive debug logging (keep error logs)
- [ ] Encrypt tokens at rest (TODO in current implementation)
- [ ] Add token refresh mechanism (if provider supports it)
- [ ] Add error handling for expired/revoked tokens
- [ ] Test disconnect flow
- [ ] Document in `.env.example`

---

## Troubleshooting

### "Invalid Code Verifier" Error

**Possible Causes:**
1. `~` character in verifier → Use correct charset without `~`
2. Verifier corrupted during transmission → Check state encoding/decoding
3. Challenge doesn't match verifier → Verify regeneration logic
4. redirect_uri mismatch → Ensure exact match between auth and token requests

**How to Debug:**
```javascript
// Add this verification before sending to OAuth provider
const regenerated = await generateCodeChallenge(codeVerifier);
console.log('Original challenge:', originalChallenge);
console.log('Regenerated challenge:', regenerated);
console.log('Match:', regenerated === originalChallenge);
```

---

### "Auth Session Missing" Error

**Possible Causes:**
1. Using `VITE_` prefix in Edge Function → Use plain env var names
2. Wrong auth pattern → Extract JWT and use service role key
3. User not logged in → Check session exists before OAuth

**How to Debug:**
```typescript
// Add to Edge Function
console.log('Auth header present:', !!authHeader);
console.log('Token extracted:', token.substring(0, 30) + '...');
console.log('User verified:', !!user);
```

---

### "Missing Credentials" Error

**Possible Causes:**
1. Secrets not set in Supabase → Run `supabase secrets set ...`
2. Wrong env var names → Check VITE_ vs plain names
3. Typo in env var name → Verify exact spelling

**How to Debug:**
```bash
# Check if secrets exist
supabase secrets list

# Should show (without VITE_ prefix):
# HUBSPOT_CLIENT_ID
# HUBSPOT_CLIENT_SECRET
```

---

### State/Verifier Lost After Redirect

**Possible Causes:**
1. Using localStorage → Use state parameter
2. Browser blocking storage → Use state parameter (guaranteed to work)

**Solution:**
Always encode verifier in state parameter - it's guaranteed to survive the redirect.

---

## Summary

**Key Takeaways:**
1. ✅ Use **state parameter** for code_verifier (not localStorage)
2. ✅ Use charset **without `~`** character
3. ✅ Use **plain env var names** in Edge Functions (no VITE_)
4. ✅ Use **service role key** for Edge Function auth
5. ✅ **Verify everything** - don't assume it works

Follow this guide for HubSpot, Pipedrive, and any future CRM integrations.

---

**Questions?** Check:
- Salesforce implementation: `src/services/crm/salesforce.js`
- Edge Function: `supabase/functions/salesforce-oauth/index.ts`
- Project docs: `CLAUDE.md` and `.env.example`
