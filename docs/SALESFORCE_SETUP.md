# Salesforce Integration Setup Guide

## External Client App vs Connected App

As of 2025, Salesforce recommends using **External Client Apps** instead of Connected Apps for new integrations. Here's why:

### External Client Apps (Recommended)
✅ **Secure by default** - Not available to all users automatically
✅ **Explicit permissions** - Must grant access via Permission Sets/Profiles
✅ **Modern approach** - Salesforce's forward-looking integration model
✅ **Not affected by 2025 security restrictions** - Built with best practices
✅ **Better for enterprise** - Follows least-privilege security model

### Connected Apps (Legacy)
❌ **Open by default** - Available to all users unless restricted
❌ **Affected by Sept 2025 restrictions** - Many uninstalled apps now blocked
❌ **Legacy approach** - Still works, but not recommended for new projects

---

## Step-by-Step Setup: External Client App

### 1. Navigate to External Client Apps

1. Log in to your Salesforce org as an Administrator
2. Click the **Setup** gear icon (top right)
3. In Quick Find, search for **"External Client Apps"**
4. Click **"External Client Apps"** under Apps

### 2. Create New External Client App

1. Click **"New"** button
2. Fill in basic information:
   - **External Client App Name**: `Field Intel Voice CRM`
   - **Description**: `Voice-to-CRM integration for field sales teams`
   - **Contact Email**: Your admin email

### 3. Enable OAuth Settings

1. Check **"Enable OAuth Settings"**
2. Configure OAuth settings:
   - **Callback URL**:
     - Development: `http://localhost:5173/settings/crm/callback/salesforce`
     - Production: `https://your-domain.com/settings/crm/callback/salesforce`
   - **Selected OAuth Scopes** (Add these):
     - ✅ Access and manage your data (api)
     - ✅ Perform requests on your behalf at any time (refresh_token, offline_access)
   - **Refresh Token Policy**: Refresh token is valid until revoked

### 4. Additional Security Settings (Optional but Recommended)

- **IP Relaxation**: Relax IP restrictions (for mobile field use)
- **Refresh Token Policy**: Choose expiration policy based on your security requirements

### 5. Save and Get Credentials

1. Click **"Save"**
2. After saving, you'll see:
   - **Consumer Key** (this is your Client ID)
   - **Consumer Secret** (click "Click to reveal" to see it)
3. **Copy these values** - you'll need them for your `.env.local` file

### 6. Create Permission Set for Access Control

External Client Apps require explicit permission grants:

1. Go to **Setup** > Quick Find: **"Permission Sets"**
2. Click **"New"**
3. Fill in:
   - **Label**: `Field Intel Access`
   - **API Name**: `Field_Intel_Access`
   - **Description**: `Grants access to Field Intel Voice CRM External Client App`
4. Click **"Save"**
5. In the Permission Set detail page:
   - Click **"Assigned Connected Apps"** (yes, it says "Connected Apps" but works for External Client Apps too)
   - Click **"Edit"**
   - Find and select **"Field Intel Voice CRM"**
   - Click **"Save"**

### 7. Assign Permission Set to Users

1. Still in the Permission Set page, click **"Manage Assignments"**
2. Click **"Add Assignments"**
3. Select users who should have access to Field Intel
4. Click **"Assign"**

**Important**: Only users with this Permission Set assigned can use Field Intel to connect to Salesforce.

---

## Configure Your Application

### 1. Update `.env.local`

Copy the credentials from Salesforce:

```bash
# Salesforce External Client App credentials
VITE_SALESFORCE_CLIENT_ID=3MVG9xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_SALESFORCE_CLIENT_SECRET=9876543210987654321
```

### 2. Update Callback URL (if using custom domain)

If you're deploying to a custom domain, update the redirect URI in:

- **Salesforce**: External Client App settings > Edit > Callback URL
- **Application**: No code changes needed - it automatically uses `window.location.origin`

### 3. Test the Integration

1. Start your application
2. Navigate to **Settings** page
3. Click **"Connect Salesforce"**
4. You should be redirected to Salesforce login
5. After login, approve the permissions
6. You should be redirected back with a successful connection

---

## Troubleshooting

### Error: "error=invalid_client_id"

**Cause**: The Client ID in your `.env.local` doesn't match Salesforce
**Fix**: Double-check the Consumer Key from Salesforce matches your `VITE_SALESFORCE_CLIENT_ID`

### Error: "redirect_uri_mismatch"

**Cause**: The callback URL in your app doesn't match Salesforce settings
**Fix**:
1. Check the URL in browser when error occurs
2. Update Salesforce External Client App > Edit > Callback URL to match exactly

### Error: "user hasn't approved this consumer"

**Cause**: User doesn't have the Permission Set assigned
**Fix**:
1. Go to Setup > Permission Sets > Field Intel Access
2. Manage Assignments > Add the user

### Error: "invalid_grant" when refreshing token

**Cause**: Refresh token expired or was revoked
**Fix**: User needs to disconnect and reconnect Salesforce in Settings

---

## Security Best Practices

### 1. Protect Your Client Secret

- ✅ Store in environment variables only
- ✅ Never commit to git
- ✅ Use different secrets for dev/staging/production
- ❌ Never expose in frontend code (use Supabase Edge Functions for sensitive operations)

### 2. Token Storage

- ✅ Store access tokens encrypted in database
- ✅ Store refresh tokens encrypted separately
- ✅ Implement token rotation
- ❌ Never log tokens in console.log

### 3. Permission Scopes

Only request the scopes you need:
- `api` - Access Salesforce data
- `refresh_token` - Get refresh tokens
- `offline_access` - Access data when user is offline

### 4. IP Restrictions (Optional)

If your field team uses fixed IPs, you can restrict access:
1. External Client App > Edit
2. Add **Permitted Users** or **IP Ranges**

---

## Migration from Connected App

If you have an existing Connected App and want to migrate:

### Option 1: Create New External Client App (Recommended)

Follow the steps above to create a fresh External Client App. Users will need to reconnect.

### Option 2: Migrate Existing Connected App

Salesforce now supports migrating Connected Apps to External Client Apps:
1. Setup > App Manager > Find your Connected App
2. Click dropdown > **"Migrate to External Client App"**
3. Follow the migration wizard

**Note**: Migration preserves OAuth credentials, so users won't need to reconnect.

---

## Testing Checklist

Before going live, test:

- [ ] User can initiate Salesforce connection
- [ ] OAuth flow redirects correctly
- [ ] User approves permissions
- [ ] Tokens are stored securely in database
- [ ] Access token works for API calls (create contact)
- [ ] Refresh token works when access token expires
- [ ] User can disconnect Salesforce
- [ ] Error handling works (invalid credentials, denied permissions)
- [ ] Only users with Permission Set can connect

---

## Support Resources

- [Salesforce External Client Apps Documentation](https://help.salesforce.com/s/articleView?id=sf.connected_apps_and_external_client_apps_features.htm)
- [Salesforce OAuth 2.0 Web Server Flow](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_web_server_flow.htm)
- [Salesforce REST API Reference](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/)

---

## Questions?

If you encounter issues not covered here, check:
1. Salesforce Setup Audit Trail for permission/config changes
2. Browser Network tab for OAuth redirect errors
3. Supabase logs for token storage issues
4. Application console logs (search for `[Salesforce]` prefix)
