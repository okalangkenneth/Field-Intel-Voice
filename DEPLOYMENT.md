# Field Intel - Deployment Guide

Complete guide to deploy Field Intel Voice-to-CRM application to production.

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- OpenAI API key
- Vercel account (free tier works)
- Git installed

---

## Step 1: Set Up Supabase

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - Name: `field-intel-voice-crm`
   - Database Password: (generate strong password)
   - Region: (choose closest to your users)
4. Wait for project to finish setting up (~2 minutes)

### 1.2 Create Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. Click "New Bucket"
3. Name: `audio-recordings`
4. Public bucket: **NO** (keep private)
5. Click "Create bucket"

### 1.3 Set Up Storage Policies

In Storage → audio-recordings → Policies:

**Insert Policy:**
```sql
CREATE POLICY "Users can upload own audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Select Policy:**
```sql
CREATE POLICY "Users can read own audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Delete Policy:**
```sql
CREATE POLICY "Users can delete own audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 1.4 Run Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

Your project ref is in: **Project Settings → General → Reference ID**

### 1.5 Get Supabase Credentials

Go to **Project Settings → API**

Copy these values:
- Project URL: `https://xxxxx.supabase.co`
- `anon` public key: `eyJxxx...`
- `service_role` secret key: `eyJxxx...` (⚠️ NEVER expose to frontend)

---

## Step 2: Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in or create account
3. Go to **API Keys**
4. Click "Create new secret key"
5. Name it `field-intel-production`
6. Copy the key (starts with `sk-...`)
7. ⚠️ **Store safely - you can't see it again**

---

## Step 3: Deploy Supabase Edge Functions

### 3.1 Configure Environment Variables

Create `supabase/.env`:

```bash
OPENAI_API_KEY=sk-...
```

### 3.2 Deploy Transcribe Function

```bash
supabase functions deploy transcribe --no-verify-jwt
```

### 3.3 Deploy Analyze Function

```bash
supabase functions deploy analyze --no-verify-jwt
```

### 3.4 Set Secrets

```bash
# Set OpenAI API key
supabase secrets set OPENAI_API_KEY=sk-...

# Verify secrets
supabase secrets list
```

### 3.5 Test Functions

```bash
# Test transcribe function
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/transcribe' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"test": true}'

# Should return 400 (expected - validates request works)
```

---

## Step 4: Configure Local Environment

Create `.env.local` in project root:

```bash
# Supabase (Frontend - can be exposed)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# Supabase (Backend - NEVER expose to frontend)
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# OpenAI (Backend only - used in Edge Functions)
OPENAI_API_KEY=sk-...

# Feature Flags
VITE_ENABLE_OFFLINE_MODE=true
VITE_MAX_RECORDING_DURATION=300000
VITE_AUTO_SYNC_TO_CRM=false
VITE_SHOW_CONFIDENCE_SCORES=true

# API Base URL
VITE_API_BASE_URL=https://xxxxx.supabase.co/functions/v1

# Environment
NODE_ENV=production
```

---

## Step 5: Test Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:5173
```

**Test checklist:**
- ✅ Sign up / Sign in works
- ✅ Microphone permission request works
- ✅ Voice recording works (see waveform)
- ✅ Save & Transcribe uploads audio
- ✅ History page shows recordings
- ✅ Click recording to see transcription (may take 30 seconds)
- ✅ Analysis results appear after transcription

---

## Step 6: Deploy to Vercel

### 6.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 6.2 Login to Vercel

```bash
vercel login
```

### 6.3 Deploy

```bash
# First deployment (will ask configuration questions)
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: field-intel-voice-crm
# - Directory: ./
# - Override settings? No

# Deploy to production
vercel --prod
```

### 6.4 Set Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables (for Production):

| Name | Value | Type |
|------|-------|------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Plain Text |
| `VITE_SUPABASE_ANON_KEY` | `eyJxxx...` | Plain Text |
| `VITE_API_BASE_URL` | `https://xxxxx.supabase.co/functions/v1` | Plain Text |
| `VITE_ENABLE_OFFLINE_MODE` | `true` | Plain Text |
| `VITE_MAX_RECORDING_DURATION` | `300000` | Plain Text |

⚠️ **DO NOT** add these to Vercel (keep server-side only in Supabase):
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

### 6.5 Redeploy After Adding Variables

```bash
vercel --prod
```

---

## Step 7: Configure Custom Domain (Optional)

### In Vercel:

1. Go to **Settings → Domains**
2. Add your domain: `app.yourdomain.com`
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

### Update Supabase Redirect URLs:

1. Go to Supabase Dashboard → **Authentication → URL Configuration**
2. Add to **Redirect URLs**:
   - `https://app.yourdomain.com`
   - `https://app.yourdomain.com/**`

---

## Step 8: Enable Authentication

### 8.1 Configure Email Templates

Supabase Dashboard → **Authentication → Email Templates**

Customize:
- **Confirm signup** - Welcome email
- **Magic Link** - Passwordless login
- **Change Email Address** - Confirm email change

### 8.2 Enable Social Providers (Optional)

Supabase Dashboard → **Authentication → Providers**

Enable:
- Google OAuth
- GitHub OAuth
- Microsoft OAuth

---

## Step 9: Monitor and Debug

### Check Supabase Logs

Dashboard → **Database → Logs**
- Monitor SQL queries
- Check RLS policy violations

### Check Edge Function Logs

Dashboard → **Edge Functions → Logs**
```bash
# Or via CLI
supabase functions logs transcribe
supabase functions logs analyze
```

### Check Vercel Logs

Dashboard → Your Project → **Deployments** → Click deployment → **Functions** tab

---

## Step 10: Post-Deployment Checklist

- [ ] Test sign up flow end-to-end
- [ ] Test recording → transcription → analysis pipeline
- [ ] Verify audio files are stored in Supabase Storage
- [ ] Check database has recordings, transcriptions, analysis_results
- [ ] Test on mobile browsers (Chrome, Safari)
- [ ] Test PWA install (Add to Home Screen)
- [ ] Verify HTTPS is working
- [ ] Check console for errors
- [ ] Test with poor network conditions
- [ ] Verify max 5-minute recording limit
- [ ] Check OpenAI API usage dashboard (monitor costs)

---

## Costs Estimate (Free Tiers)

### Supabase (Free Tier)
- Database: 500 MB
- Storage: 1 GB
- Bandwidth: 2 GB/month
- **Cost:** $0/month

### OpenAI API (Pay as you go)
- Whisper: $0.006/minute
- GPT-4 Turbo: ~$0.02/recording
- Example: 100 recordings/month = ~$3/month

### Vercel (Hobby Tier)
- Bandwidth: 100 GB/month
- Build minutes: 100/month
- **Cost:** $0/month

**Total:** ~$3/month for 100 recordings

---

## Troubleshooting

### "Permission denied" on recording upload

**Solution:** Check Storage policies in Supabase. Ensure user is authenticated.

### Transcription not starting

**Solution:**
1. Check Edge Function logs: `supabase functions logs transcribe`
2. Verify `OPENAI_API_KEY` is set: `supabase secrets list`
3. Check audio file uploaded to Storage bucket

### "Failed to fetch" errors

**Solution:**
1. Check `VITE_API_BASE_URL` in `.env.local`
2. Verify Edge Functions are deployed
3. Check CORS headers in Edge Functions

### Mobile recording not working

**Solution:**
1. Ensure HTTPS (required for microphone access)
2. Test in Chrome/Safari (Firefox mobile has issues)
3. Check browser permissions settings

---

## Scaling to Production

### When you outgrow free tiers:

**Supabase Pro ($25/month):**
- 8 GB database
- 100 GB storage
- 50 GB bandwidth
- Better performance

**Vercel Pro ($20/month):**
- More bandwidth
- Better analytics
- Team collaboration

**Optimize OpenAI costs:**
- Use Whisper for clear audio only
- Implement caching for repeated transcriptions
- Consider fine-tuned models for lower cost

---

## Security Best Practices

✅ **DO:**
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only
- Keep `OPENAI_API_KEY` in Supabase secrets only
- Use Row Level Security (RLS) policies
- Validate all inputs
- Rate limit API calls
- Enable 2FA on Supabase/Vercel accounts

❌ **DON'T:**
- Expose service role key to frontend
- Commit secrets to git
- Disable RLS policies
- Skip input validation
- Allow unlimited uploads

---

## Support

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- OpenAI Docs: https://platform.openai.com/docs
- Project Issues: https://github.com/yourusername/field-intel/issues

---

**🎉 Congratulations! Your Field Intel app is now live!**
