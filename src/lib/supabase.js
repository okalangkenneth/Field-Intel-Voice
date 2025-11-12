import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables');
  throw new Error('Missing Supabase environment variables. Please check .env.local file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'field-intel-voice-crm',
    },
  },
});

console.log('[Supabase] Client initialized');

// Helper functions for common operations
export const supabaseHelpers = {
  // Auth helpers
  async signUp(email, password, metadata = {}) {
    console.log('[Supabase] Sign up attempt:', { email });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) console.error('[Supabase] Sign up error:', error);
    return { data, error };
  },

  async signIn(email, password) {
    console.log('[Supabase] Sign in attempt:', { email });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) console.error('[Supabase] Sign in error:', error);
    return { data, error };
  },

  async signOut() {
    console.log('[Supabase] Sign out');
    const { error } = await supabase.auth.signOut();
    if (error) console.error('[Supabase] Sign out error:', error);
    return { error };
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) console.error('[Supabase] Get user error:', error);
    return { user, error };
  },

  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) console.error('[Supabase] Get session error:', error);
    return { session, error };
  },

  // Storage helpers
  async uploadAudio(file, userId) {
    console.log('[Supabase] Uploading audio:', { fileName: file.name, size: file.size, userId });
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('audio-recordings')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[Supabase] Audio upload error:', error);
      return { data: null, error };
    }

    console.log('[Supabase] Audio uploaded successfully:', { path: data.path });
    return { data, error: null };
  },

  async deleteAudio(path) {
    console.log('[Supabase] Deleting audio:', { path });
    const { error } = await supabase.storage
      .from('audio-recordings')
      .remove([path]);

    if (error) console.error('[Supabase] Audio delete error:', error);
    return { error };
  },

  getAudioUrl(path) {
    const { data } = supabase.storage
      .from('audio-recordings')
      .getPublicUrl(path);
    return data.publicUrl;
  },

  // Database helpers
  async saveRecording(recordingData) {
    console.log('[Supabase] Saving recording to database');
    const { data, error } = await supabase
      .from('recordings')
      .insert([recordingData])
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Save recording error:', error);
      return { data: null, error };
    }

    console.log('[Supabase] Recording saved:', { id: data.id });
    return { data, error: null };
  },

  async getRecordings(userId, limit = 50) {
    console.log('[Supabase] Fetching recordings:', { userId, limit });
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) console.error('[Supabase] Get recordings error:', error);
    return { data, error };
  },

  async updateRecording(id, updates) {
    console.log('[Supabase] Updating recording:', { id, updates });
    const { data, error } = await supabase
      .from('recordings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) console.error('[Supabase] Update recording error:', error);
    return { data, error };
  },

  async deleteRecording(id) {
    console.log('[Supabase] Deleting recording:', { id });
    const { error } = await supabase
      .from('recordings')
      .delete()
      .eq('id', id);

    if (error) console.error('[Supabase] Delete recording error:', error);
    return { error };
  },
};
