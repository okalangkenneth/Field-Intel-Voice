# Field Intel - Testing Guide

**Last Updated:** November 15, 2025

Step-by-step guide to test Field Intel Voice-to-CRM functionality.

---

## Prerequisites

Before testing, ensure:
- [ ] App is running locally (`npm run dev`)
- [ ] You're logged into the app
- [ ] Supabase project is set up
- [ ] OpenAI API key is deployed (see Step 1 below)

---

## Step 1: Deploy OpenAI API Key (REQUIRED)

**Time:** 5 minutes

```bash
# 1. Set the OpenAI API key in Supabase
supabase secrets set OPENAI_API_KEY="sk-your-actual-openai-key-here"

# 2. Verify it was set correctly
supabase secrets list

# You should see:
# OPENAI_API_KEY - [hash]
```

**Verification:**
- ✅ `supabase secrets list` shows OPENAI_API_KEY

**If it fails:**
- Make sure you're logged in: `supabase login`
- Make sure you're linked to project: `supabase link`

---

## Step 2: Test Voice Recording

**Time:** 10 minutes

### 2.1 Record Audio

1. Open app: http://localhost:5173
2. Navigate to **Record** page
3. Click **"Start Recording"** button
4. **Speak clearly for 30 seconds:**
   ```
   "Hi, this is Kenneth calling about the property management software.
   I spoke with Sarah Johnson from Acme Properties yesterday.
   She's interested in our CRM solution and wants to schedule a demo next week.
   Her email is sarah.johnson@acmeprops.com.
   Follow up: Send proposal by Friday."
   ```
5. Click **"Stop Recording"**
6. Verify you see a confirmation message
7. Navigate to **History** page
8. Verify your recording appears in the list

### 2.2 Verify in Supabase

**Check Storage:**
1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to **Storage** → **audio-recordings**
3. You should see a folder with your user ID
4. Inside: `{timestamp}-recording.webm`

**Check Database:**
1. Go to **Table Editor** → **recordings**
2. Find your recording (most recent)
3. Verify fields:
   - `audio_file_path`: Should have path
   - `duration_ms`: Should show duration
   - `status`: Should be `'completed'`

**Expected Result:** ✅ Recording uploaded and saved

**If it fails:**
- Check browser console for errors
- Verify microphone permission granted
- Check Supabase Storage bucket exists
- Verify RLS policies allow uploads

---

## Step 3: Test Transcription

**Time:** 5-10 minutes

### 3.1 Trigger Transcription

**Automatic:** Transcription should start automatically after recording

**Manual (if needed):**
```bash
# Get your recording ID from database
# Then call the transcribe function manually:
curl -X POST https://cmpuxsspznnxhspmjlyf.supabase.co/functions/v1/transcribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{
    "recordingId": "your-recording-id",
    "audioFilePath": "user-id/timestamp-recording.webm",
    "language": "en"
  }'
```

### 3.2 Monitor Progress

**Watch Edge Function Logs:**
1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** → **transcribe** → **Logs**
3. You should see:
   ```
   [Transcribe] Function invoked
   [Transcribe] Processing: { recordingId: ..., audioFilePath: ... }
   [Transcribe] Downloading audio from storage
   [Transcribe] Calling Whisper API
   [Transcribe] Whisper API success
   [Transcribe] Saving transcription to database
   [Transcribe] Success
   ```

**Check Database:**
1. Go to **Table Editor** → **transcriptions**
2. Find your transcription (same recordingId)
3. Verify fields:
   - `transcript_text`: Should contain your spoken words
   - `confidence_score`: Should be 0.7-0.95
   - `word_count`: Should match rough word count
   - `processing_time_ms`: Should be < 30000 (30 seconds)

**Check Recording Status:**
1. Go to **Table Editor** → **recordings**
2. Find your recording
3. Verify `status = 'transcribed'`

**Expected Result:** ✅ Transcription text saved to database

**If it fails:**
1. **Check Edge Function Logs** for errors
2. **Common Issues:**
   - "OPENAI_API_KEY not configured" → Run Step 1
   - "Failed to download audio" → Check storage path
   - "Whisper API error" → Check OpenAI API key validity
   - Timeout → Recording too long (max 5 min)

---

## Step 4: Test AI Analysis

**Time:** 5-10 minutes

### 4.1 Trigger Analysis

**Automatic:** Analysis should start automatically after transcription

**Check if it ran:**
1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** → **analyze** → **Logs**
3. Look for recent invocation

### 4.2 Verify Results

**Check Database:**
1. Go to **Table Editor** → **analysis_results**
2. Find your analysis (same recordingId)
3. Verify extracted data:

**Expected Extraction (from test script):**
```json
{
  "contacts": [
    {
      "name": "Sarah Johnson",
      "email": "sarah.johnson@acmeprops.com",
      "company": "Acme Properties",
      "confidence": 0.9
    }
  ],
  "action_items": [
    {
      "title": "Send proposal",
      "description": "Send proposal by Friday",
      "priority": "high",
      "due_date": "2025-11-19" // Next Friday
    },
    {
      "title": "Schedule demo",
      "description": "Schedule demo next week",
      "priority": "medium"
    }
  ],
  "sentiment": "positive",
  "buying_signals": [
    "Interested in CRM solution",
    "Wants to schedule demo"
  ],
  "key_topics": [
    "CRM solution",
    "Demo scheduling",
    "Proposal"
  ]
}
```

**Check in App:**
1. Navigate to **History** page
2. Click on your recording
3. Verify you see:
   - Transcript text
   - Extracted contacts
   - Action items
   - Sentiment badge

**Expected Result:** ✅ Contacts and action items extracted correctly

**If it fails:**
1. **Check Edge Function Logs** (analyze function)
2. **Common Issues:**
   - No analysis triggered → Check transcription completed
   - Empty results → Check GPT-4 API response
   - "OPENAI_API_KEY not configured" → Verify key set
   - Poor extraction → Improve voice script (be more explicit)

---

## Step 5: Test CRM Sync

**Status:** ✅ CRM sync function implemented and deployed - Ready to test!

**Time:** 10-15 minutes

### 5.1 Prerequisites
- Salesforce account connected (Settings → CRM → Connect Salesforce)
- OAuth completed successfully
- Analysis completed (Step 4) with confidence >= 80%

### 5.2 Trigger CRM Sync

**Automatic:** CRM sync runs automatically after analysis completes (if confidence >= 80%)

**Check if it ran:**
1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** → **crm-sync** → **Logs**
3. Look for recent invocation within 5-10 seconds of analysis

### 5.3 Monitor Progress

**Watch Edge Function Logs:**
You should see:
```
[CRM Sync] Function invoked
[CRM Sync] Processing: { analysisId: ..., recordingId: ... }
[CRM Sync] Fetching analysis results
[CRM Sync] Analysis found for user: [userId]
[CRM Sync] Fetching CRM credentials
[CRM Sync] CRM provider: salesforce
[CRM Sync] Data to sync: { contacts: 1, actionItems: 2 }
[CRM Sync] Syncing contact: Sarah Johnson
[CRM Sync] Contact synced: [contactId]
[CRM Sync] Syncing task: Send proposal
[CRM Sync] Task synced: [taskId]
[CRM Sync] Logging sync result: completed
[CRM Sync] Sync completed: { status: 'completed', contacts: 1, tasks: 2 }
```

### 5.4 Verify in Database

**Check crm_sync_logs table:**
1. Go to **Table Editor** → **crm_sync_logs**
2. Find your sync (most recent)
3. Verify fields:
   - `status`: Should be 'completed' (or 'partial' if some failed)
   - `provider`: 'salesforce'
   - `synced_data`: JSON with contacts/tasks counts
   - `error_message`: Should be null (or specific error if failed)

**Check recordings table:**
1. Go to **Table Editor** → **recordings**
2. Find your recording
3. Verify `status = 'synced'`

### 5.5 Verify in Salesforce

**Check Contact Created:**
1. Open Salesforce
2. Go to **Contacts** (or **Sales** → **Contacts**)
3. Search for "Sarah Johnson" (or the name from your test)
4. Click on the contact
5. Verify fields:
   - Email: sarah.johnson@acmeprops.com
   - Company: Acme Properties (if extracted)
   - Description: Should mention "Extracted from voice recording"

**Check Tasks Created:**
1. While viewing the contact, scroll to **Activity** section
2. Look for tasks:
   - "Send proposal" (Priority: High, Due: This Friday)
   - "Schedule demo" (Priority: Medium)
3. Verify tasks are linked to the contact

**Expected Result:** ✅ Contact and tasks appear in Salesforce, linked correctly

**If it fails:**
1. **Check Edge Function Logs** (crm-sync function)
2. **Common Issues:**
   - "CRM not connected" → Connect Salesforce in Settings
   - "Auth session missing" → Verify user logged in
   - "Failed to create contact" → Check Salesforce API permissions
   - "Failed to create task" → Check task data validity
   - OAuth token expired → Reconnect Salesforce
3. **Check crm_sync_logs table** for error details
4. **Retry:**
   - Manual retry: Can call function again via Supabase dashboard
   - Or: Record new voice note and test again

---

## Step 6: End-to-End Test (Complete Pipeline)

**Time:** 15 minutes

### Complete Flow Test

1. **Record:**
   - Go to Record page
   - Record 30-second test script (see Step 2)
   - Verify recording appears in History

2. **Wait & Monitor:**
   - Wait 30-60 seconds for processing
   - Watch Edge Function logs:
     - transcribe → analyze → crm-sync

3. **Verify Database:**
   - `recordings` table: status = 'synced'
   - `transcriptions` table: has text
   - `analysis_results` table: has contacts/tasks
   - `crm_sync_logs` table: status = 'completed'

4. **Verify Salesforce:**
   - Open Salesforce
   - Go to Contacts
   - Search for "Sarah Johnson"
   - Verify contact exists with:
     - Email: sarah.johnson@acmeprops.com
     - Company: Acme Properties
   - Check Tasks/Activities:
     - "Send proposal" task exists
     - "Schedule demo" task exists

5. **Verify UI:**
   - Go to Dashboard
   - Verify metrics updated
   - Check activity feed shows sync

**Expected Result:** ✅ Full pipeline works, data in Salesforce

**If it fails:**
- Check each step individually (Steps 2-5)
- Review logs for each function
- Check Salesforce API credentials
- Verify OAuth connection still active

---

## Common Issues & Solutions

### Issue: "Microphone Permission Denied"
**Solution:**
1. Check browser permissions (click lock icon in address bar)
2. Allow microphone access
3. Refresh page and try again

### Issue: "Failed to Upload Audio"
**Solution:**
1. Check Supabase Storage bucket exists: `audio-recordings`
2. Verify RLS policies allow authenticated uploads
3. Check browser console for specific error
4. Try logging out and back in

### Issue: "Transcription Takes Too Long"
**Solution:**
- Whisper API can take 5-30 seconds for 30-second audio
- Check Edge Function logs for progress
- If > 1 minute, check for errors
- Try with shorter recording (<30 seconds)

### Issue: "No Contacts Extracted"
**Solution:**
1. Verify transcript text is clear
2. Make sure you spoke names, emails, companies clearly
3. Check GPT-4 response in logs
4. Try more explicit phrasing:
   - "The contact is John Smith"
   - "His email is john@example.com"
   - "He works at ABC Company"

### Issue: "CRM Sync Failed"
**Solution:**
1. Verify Salesforce connection (Settings → CRM)
2. Check OAuth token hasn't expired
3. Verify Salesforce API permissions
4. Check crm_sync_logs table for error details

---

## Performance Benchmarks

### Expected Timing (30-second recording)

| Step | Expected Time | Notes |
|------|---------------|-------|
| Recording | 30 seconds | Real-time |
| Upload | 1-2 seconds | Depends on connection |
| Transcription | 5-15 seconds | Whisper API |
| Analysis | 5-10 seconds | GPT-4 API |
| CRM Sync | 2-5 seconds | Salesforce API |
| **Total** | **~40-60 seconds** | End-to-end |

### Cost per Test

| Service | Cost |
|---------|------|
| 30-second recording | $0.003 (Whisper) |
| GPT-4 analysis | ~$0.02-0.03 |
| Storage | ~$0.00001 |
| **Total** | **~$0.025** per test |

**100 tests = ~$2.50** - Very affordable for thorough testing!

---

## Test Data Script

Use this script for consistent testing:

```
"Hi, this is [Your Name] calling about the [product/service].

I just had a great conversation with [Contact Name] from [Company Name].
They're very interested in [specific feature] and want to move forward.

Contact details:
- Name: [Full Name]
- Email: [email@example.com]
- Phone: [phone number]
- Company: [Company Name]

Action items:
- Send proposal by [specific date]
- Schedule demo for [next week/specific time]
- Follow up on pricing questions

The client seems very positive and mentioned they have budget approved.
They want to start implementation by [specific month].

Thank you!"
```

**Example (Copy/Paste):**
```
"Hi, this is Kenneth calling about the property management software.

I just had a great conversation with Sarah Johnson from Acme Properties.
She's very interested in our automated rent collection feature and wants to move forward.

Contact details:
- Name: Sarah Johnson
- Email: sarah.johnson@acmeprops.com
- Phone: 555-123-4567
- Company: Acme Properties

Action items:
- Send proposal by this Friday
- Schedule demo for next Tuesday at 2pm
- Follow up on pricing questions for enterprise tier

The client seems very positive and mentioned they have budget approved.
They want to start implementation by January.

Thank you!"
```

---

## Debugging Checklist

If something doesn't work:

1. **Check Browser Console** (F12 → Console tab)
   - Look for red errors
   - Check network requests (Network tab)

2. **Check Supabase Logs**
   - Edge Functions → [function name] → Logs
   - Look for errors or warnings

3. **Check Database**
   - Table Editor → Check relevant tables
   - Verify data is being saved

4. **Check Secrets**
   ```bash
   supabase secrets list
   ```
   - OPENAI_API_KEY should be present
   - SALESFORCE_CLIENT_ID should be present
   - SALESFORCE_CLIENT_SECRET should be present

5. **Check Function Deployment**
   ```bash
   supabase functions list
   ```
   - All functions should show STATUS: ACTIVE

6. **Check Environment Variables**
   ```bash
   # In .env.local file
   cat .env.local | grep VITE_
   ```
   - All VITE_* variables should be set

---

## Next Steps After Testing

Once all tests pass:

1. **Remove Excessive Logging**
   - Clean up console.log statements
   - Keep error logging

2. **Add Error Handling UI**
   - Show user-friendly error messages
   - Add retry buttons

3. **Implement CRM Sync Function**
   - This is the critical missing piece!

4. **Test with Real Data**
   - Record actual sales calls
   - Verify accuracy

5. **Deploy to Production**
   - Follow DEPLOYMENT.md
   - Test in production environment

---

**Questions or Issues?**
- Check [PROJECT_STATUS.md](PROJECT_STATUS.md) for current status
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for setup help
- Check Supabase Dashboard logs for errors
