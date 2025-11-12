-- Field Intel Database Schema
-- Initial migration for voice-to-CRM application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE recording_status AS ENUM ('recording', 'completed', 'transcribing', 'transcribed', 'analyzing', 'analyzed', 'syncing', 'synced', 'failed');
CREATE TYPE sentiment_type AS ENUM ('positive', 'neutral', 'negative', 'urgent');
CREATE TYPE crm_provider AS ENUM ('salesforce', 'hubspot', 'pipedrive');
CREATE TYPE sync_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');

-- User profiles table (extends auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'sales_rep', -- 'sales_rep' | 'manager' | 'admin'
  team_id UUID,
  crm_provider crm_provider,
  crm_connected BOOLEAN DEFAULT FALSE,
  crm_access_token TEXT, -- Encrypted in production
  crm_refresh_token TEXT, -- Encrypted in production
  crm_user_id TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recordings table
CREATE TABLE public.recordings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  audio_file_path TEXT NOT NULL,
  audio_file_url TEXT,
  duration_ms INTEGER NOT NULL, -- Duration in milliseconds
  file_size_bytes INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  status recording_status DEFAULT 'completed' NOT NULL,
  error_message TEXT,
  metadata JSONB DEFAULT '{}', -- { quality, location, etc }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete for GDPR compliance
);

-- Transcriptions table
CREATE TABLE public.transcriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recording_id UUID REFERENCES public.recordings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  transcript_text TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  processing_time_ms INTEGER,
  word_count INTEGER,
  api_provider TEXT DEFAULT 'openai_whisper',
  api_cost DECIMAL(10,4), -- Track API costs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analysis results table (GPT-4 extracted data)
CREATE TABLE public.analysis_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transcription_id UUID REFERENCES public.transcriptions(id) ON DELETE CASCADE NOT NULL,
  recording_id UUID REFERENCES public.recordings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,

  -- Extracted entities
  contacts JSONB DEFAULT '[]', -- [{ name, title, company, email, phone, confidence }]
  companies JSONB DEFAULT '[]', -- [{ name, industry, size, confidence }]
  action_items JSONB DEFAULT '[]', -- [{ task, due_date, priority, confidence }]
  dates JSONB DEFAULT '[]', -- [{ date, context, confidence }]
  buying_signals JSONB DEFAULT '[]', -- [{ signal, strength, confidence }]

  -- Sentiment analysis
  overall_sentiment sentiment_type,
  sentiment_score DECIMAL(3,2), -- -1.00 to 1.00
  sentiment_explanation TEXT,

  -- Meeting summary
  summary TEXT,
  key_points JSONB DEFAULT '[]', -- [{ point, importance }]
  next_steps TEXT,

  -- Metadata
  confidence_score DECIMAL(3,2), -- Overall confidence
  processing_time_ms INTEGER,
  api_cost DECIMAL(10,4),
  user_edited BOOLEAN DEFAULT FALSE, -- Track if user manually corrected

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM sync logs table
CREATE TABLE public.crm_sync_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  analysis_id UUID REFERENCES public.analysis_results(id) ON DELETE CASCADE NOT NULL,
  recording_id UUID REFERENCES public.recordings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,

  crm_provider crm_provider NOT NULL,
  sync_status sync_status DEFAULT 'pending' NOT NULL,

  -- What was synced
  crm_record_type TEXT, -- 'contact' | 'opportunity' | 'task' | 'note'
  crm_record_id TEXT, -- ID in the CRM system
  crm_record_url TEXT,

  -- Sync details
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  sync_duration_ms INTEGER,

  -- Field mapping used
  field_mapping JSONB DEFAULT '{}',
  synced_data JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table (for manager dashboard)
CREATE TABLE public.teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  manager_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add team_id foreign key to user_profiles
ALTER TABLE public.user_profiles
  ADD CONSTRAINT fk_team
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_recordings_user_id ON public.recordings(user_id);
CREATE INDEX idx_recordings_created_at ON public.recordings(created_at DESC);
CREATE INDEX idx_recordings_status ON public.recordings(status);

CREATE INDEX idx_transcriptions_recording_id ON public.transcriptions(recording_id);
CREATE INDEX idx_transcriptions_user_id ON public.transcriptions(user_id);

CREATE INDEX idx_analysis_recording_id ON public.analysis_results(recording_id);
CREATE INDEX idx_analysis_user_id ON public.analysis_results(user_id);
CREATE INDEX idx_analysis_sentiment ON public.analysis_results(overall_sentiment);

CREATE INDEX idx_crm_sync_user_id ON public.crm_sync_logs(user_id);
CREATE INDEX idx_crm_sync_status ON public.crm_sync_logs(sync_status);
CREATE INDEX idx_crm_sync_created_at ON public.crm_sync_logs(created_at DESC);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- User profiles: Users can only read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Recordings: Users can only access their own recordings
CREATE POLICY "Users can view own recordings"
  ON public.recordings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recordings"
  ON public.recordings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recordings"
  ON public.recordings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recordings"
  ON public.recordings FOR DELETE
  USING (auth.uid() = user_id);

-- Transcriptions: Users can only access their own
CREATE POLICY "Users can view own transcriptions"
  ON public.transcriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcriptions"
  ON public.transcriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Analysis results: Users can only access their own
CREATE POLICY "Users can view own analysis"
  ON public.analysis_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis"
  ON public.analysis_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analysis"
  ON public.analysis_results FOR UPDATE
  USING (auth.uid() = user_id);

-- CRM sync logs: Users can only access their own
CREATE POLICY "Users can view own crm logs"
  ON public.crm_sync_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crm logs"
  ON public.crm_sync_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Teams: Members can view their team
CREATE POLICY "Users can view own team"
  ON public.teams FOR SELECT
  USING (
    id IN (
      SELECT team_id FROM public.user_profiles WHERE id = auth.uid()
    )
  );

-- Managers can view their team members
CREATE POLICY "Managers can view team members"
  ON public.user_profiles FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.user_profiles WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recordings_updated_at
  BEFORE UPDATE ON public.recordings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_results_updated_at
  BEFORE UPDATE ON public.analysis_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_sync_logs_updated_at
  BEFORE UPDATE ON public.crm_sync_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-delete old recordings (GDPR compliance - 30 days)
CREATE OR REPLACE FUNCTION soft_delete_old_recordings()
RETURNS void AS $$
BEGIN
  UPDATE public.recordings
  SET deleted_at = NOW()
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE public.recordings IS 'Stores audio recording metadata';
COMMENT ON TABLE public.transcriptions IS 'Stores Whisper API transcription results';
COMMENT ON TABLE public.analysis_results IS 'Stores GPT-4 extracted data from transcriptions';
COMMENT ON TABLE public.crm_sync_logs IS 'Tracks CRM synchronization attempts and results';
COMMENT ON TABLE public.teams IS 'Teams for manager dashboard organization';
