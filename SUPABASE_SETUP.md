# Quick Supabase Setup Guide

Follow these steps to complete your Supabase setup (5 minutes):

---

## Step 1: Run Database Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/cmpuxsspznnxhspmjlyf
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the ENTIRE contents of `supabase/migrations/20241112000001_initial_schema.sql`
5. Paste into the SQL Editor
6. Click **Run** (bottom right)
7. ✅ You should see "Success. No rows returned"

---

## Step 2: Create Storage Bucket

1. Go to **Storage** in the left sidebar
2. Click **New Bucket**
3. Fill in:
   - Name: `audio-recordings`
   - Public bucket: **UNCHECK** (keep private)
4. Click **Create bucket**

---

## Step 3: Add Storage Policies

1. Click on the `audio-recordings` bucket
2. Click **Policies** tab
3. Click **New Policy** → **Create policy from scratch**

**Policy 1: Insert (Upload)**
- Policy name: `Users can upload own audio`
- Target roles: `authenticated`
- WITH CHECK expression:
```sql
bucket_id = 'audio-recordings' AND (storage.foldername(name))[1] = auth.uid()::text
```
- Click **Review** → **Save policy**

**Policy 2: Select (Read)**
- Click **New Policy** → **Create policy from scratch**
- Policy name: `Users can read own audio`
- Target roles: `authenticated`
- USING expression:
```sql
bucket_id = 'audio-recordings' AND (storage.foldername(name))[1] = auth.uid()::text
```
- Click **Review** → **Save policy**

**Policy 3: Delete**
- Click **New Policy** → **Create policy from scratch**
- Policy name: `Users can delete own audio`
- Target roles: `authenticated`
- USING expression:
```sql
bucket_id = 'audio-recordings' AND (storage.foldername(name))[1] = auth.uid()::text
```
- Click **Review** → **Save policy**

---

## Step 4: Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in (or create account)
3. Click **Create new secret key**
4. Name it: `field-intel-production`
5. Copy the key (starts with `sk-...`)
6. ⚠️ **SAVE IT NOW** - you won't see it again!

---

## Step 5: Update .env.local

Open `.env.local` in your project and update:

```bash
OPENAI_API_KEY=sk-YOUR_ACTUAL_KEY_HERE
```

---

## Step 6: Set OpenAI Secret in Supabase

We'll do this after deploying Edge Functions (next step).

---

## You're Done with Manual Setup! ✅

Now we can deploy the Edge Functions programmatically.

**What you just set up:**
- ✅ Complete database schema (6 tables with RLS)
- ✅ Storage bucket for audio files
- ✅ Storage policies for security
- ✅ OpenAI API key ready

**Next:** Let me know when you've completed these steps and have your OpenAI API key, and I'll deploy the Edge Functions automatically!
