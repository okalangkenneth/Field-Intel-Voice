# Salesforce Integration Setup Guide

Complete guide to set up Salesforce CRM integration for Field Intel.

---

## Prerequisites

- Salesforce account (Sales Cloud, Service Cloud, or Developer Edition)
- System Administrator permissions in Salesforce
- Field Intel app deployed and running

---

## Step 1: Create a Connected App in Salesforce

### 1.1 Navigate to App Manager

1. Log in to Salesforce
2. Click the **gear icon** (⚙️) in the top right
3. Select **Setup**
4. In the Quick Find box, search for "App Manager"
5. Click **App Manager** under Apps

### 1.2 Create New Connected App

1. Click **New Connected App** button
2. Fill in the basic information:
   - **Connected App Name**: `Field Intel Voice CRM`
   - **API Name**: `Field_Intel_Voice_CRM` (auto-filled)
   - **Contact Email**: Your email address

### 1.3 Configure OAuth Settings

1. Check **Enable OAuth Settings**
2. **Callback URL**: Enter your app URL + callback path
   ```
   https://yourapp.vercel.app/settings/crm/callback/salesforce
   ```
   Or for local development:
   ```
   http://localhost:5173/settings/crm/callback/salesforce
   ```

3. **Selected OAuth Scopes**: Add these scopes
   - `Access and manage your data (api)`
   - `Perform requests on your behalf at any time (refresh_token, offline_access)`

4. **Require Secret for Web Server Flow**: Check this box

5. Click **Save**
6. Click **Continue**

### 1.4 Get Your Credentials

1. After saving, you'll see the **Consumer Key** (Client ID)
2. Click **Click to reveal** next to **Consumer Secret** (Client Secret)
3. Copy both values - you'll need them next

---

## Step 2: Configure Field Intel

### 2.1 Add Environment Variables

Add these to your `.env.local` file:

```bash
VITE_SALESFORCE_CLIENT_ID=your_consumer_key_here
VITE_SALESFORCE_CLIENT_SECRET=your_consumer_secret_here
```

### 2.2 For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add the same variables:
   - `VITE_SALESFORCE_CLIENT_ID` = Your Consumer Key
   - `VITE_SALESFORCE_CLIENT_SECRET` = Your Consumer Secret
4. Redeploy your app

---

## Step 3: Test the Connection

### 3.1 Connect Your Account

1. Open Field Intel app
2. Navigate to **Settings** (⚙️ button)
3. Scroll to **CRM Integration** section
4. Click on **Salesforce** card
5. You'll be redirected to Salesforce login
6. **Log in** with your Salesforce credentials
7. Click **Allow** to grant permissions
8. You'll be redirected back to Field Intel

### 3.2 Verify Connection

1. Check that the CRM section shows "Connected to salesforce"
2. Status badge should show "Active"
3. You should see a "Disconnect CRM" button

---

## Step 4: Test Data Sync

### 4.1 Create a Test Recording

1. Navigate to **Start Recording**
2. Record a test voice note mentioning a contact:
   ```
   "I just met with John Smith from Acme Corp.
    His email is john.smith@acme.com and phone is 555-1234.
    He's interested in our product and wants a follow-up call next week."
   ```
3. Stop recording and save

### 4.2 Check Salesforce

1. Wait for transcription and analysis (requires OpenAI credits)
2. Once complete, check your Salesforce org:
   - Go to **Contacts** tab
   - Search for "John Smith"
   - You should see the newly created contact
3. Check **Activities** or **Tasks**
   - You should see a follow-up task created

---

## Troubleshooting

### Connection Fails

**Error**: "Invalid client credentials"
- **Solution**: Double-check your Consumer Key and Secret match exactly
- Make sure you copied the Consumer Key (not Key ID)

**Error**: "redirect_uri_mismatch"
- **Solution**: Ensure the callback URL in Salesforce exactly matches your app's URL
- Include the full path: `/settings/crm/callback/salesforce`

### No Data Syncing

**Check 1**: Is the recording analyzed?
- Sync only happens after AI analysis completes
- Requires OpenAI API credits

**Check 2**: Check sync logs
- Go to **History** page
- Look for sync status indicators
- Check browser console for errors

**Check 3**: Verify permissions
- In Salesforce, go to Setup > Connected Apps > Manage Connected Apps
- Click on "Field Intel Voice CRM"
- Make sure your user profile is in "Permitted Users"

### Token Expired

If you see "Session expired" or "Invalid session ID":
1. Go to **Settings** in Field Intel
2. Click **Disconnect CRM**
3. Reconnect by clicking **Salesforce** again

---

## Security Best Practices

1. **Never share your credentials**: Keep your Consumer Key and Secret private
2. **Use IP restrictions** (optional):
   - In Salesforce Connected App settings
   - Add your server IPs to "IP Relaxation"
3. **Regular audits**:
   - Monitor API usage in Salesforce Setup > API Usage
   - Review sync logs in Field Intel
4. **Revoke access**: If compromised, immediately revoke the Connected App in Salesforce

---

## What Gets Synced

### Contacts
- Name (extracted from voice)
- Email address
- Phone number
- Company name
- Job title
- Confidence score in Description field

### Activities (Tasks)
- Action items mentioned in recording
- Follow-up tasks
- Due dates (if mentioned)
- Priority level
- Linked to associated contact

### Not Synced
- Audio files (stored only in Supabase)
- Full transcripts (not sent to Salesforce)
- Internal analysis metadata

---

## FAQ

**Q: Can I use Salesforce Sandbox?**
A: Yes! Just change the authorization URL in the code from `login.salesforce.com` to `test.salesforce.com`.

**Q: How much does this cost?**
A: The Salesforce integration itself is free. You only pay for:
- Salesforce licenses (if not using Developer Edition)
- OpenAI API usage for transcription/analysis

**Q: Can I sync historical recordings?**
A: Not automatically. Each recording syncs when its analysis completes. You could implement a manual "Re-sync All" button if needed.

**Q: What if a contact already exists?**
A: The integration checks by email first. If found, it updates the existing contact. If not found, it creates a new one.

**Q: Can I customize what fields get synced?**
A: Yes! Edit `src/services/crm/salesforce.js` and modify the `contactData` object in the `syncContactToSalesforce` function.

---

## Next Steps

- Set up OpenAI credits to enable transcription/analysis
- Configure auto-sync settings in Field Intel Settings
- Train your team on using voice recordings
- Monitor sync success rate in Dashboard

For issues, check the [GitHub repository](https://github.com/okalangkenneth/Field-Intel-Voice) or open an issue.
