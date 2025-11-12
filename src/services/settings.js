/**
 * Settings service - User preferences and profile management
 */

import { supabase } from '../lib/supabase.js';

/**
 * Get user profile and settings
 */
export const getUserProfile = async () => {
  console.log('[SettingsService] Fetching user profile');

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    console.log('[SettingsService] Profile loaded:', profile);
    return { data: profile, error: null };
  } catch (error) {
    console.error('[SettingsService] Error fetching profile:', error);
    return { data: null, error };
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (updates) => {
  console.log('[SettingsService] Updating profile:', updates);

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    console.log('[SettingsService] Profile updated:', data);
    return { data, error: null };
  } catch (error) {
    console.error('[SettingsService] Error updating profile:', error);
    return { data: null, error };
  }
};

/**
 * Update user settings
 */
export const updateSettings = async (settings) => {
  console.log('[SettingsService] Updating settings:', settings);

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    // Get current settings
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('settings')
      .eq('id', user.id)
      .single();

    const currentSettings = currentProfile?.settings || {};
    const updatedSettings = { ...currentSettings, ...settings };

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ settings: updatedSettings })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    console.log('[SettingsService] Settings updated:', data);
    return { data, error: null };
  } catch (error) {
    console.error('[SettingsService] Error updating settings:', error);
    return { data: null, error };
  }
};

/**
 * Disconnect CRM integration
 */
export const disconnectCRM = async () => {
  console.log('[SettingsService] Disconnecting CRM');

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        crm_provider: null,
        crm_connected: false,
        crm_access_token: null,
        crm_refresh_token: null,
        crm_user_id: null,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    console.log('[SettingsService] CRM disconnected');
    return { data, error: null };
  } catch (error) {
    console.error('[SettingsService] Error disconnecting CRM:', error);
    return { data: null, error };
  }
};

/**
 * Get recording statistics for the user
 */
export const getUserStats = async () => {
  console.log('[SettingsService] Fetching user stats');

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    const { data: recordings, error: recordingsError } = await supabase
      .from('recordings')
      .select('duration_ms, created_at')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (recordingsError) throw recordingsError;

    const totalRecordings = recordings.length;
    const totalDuration = recordings.reduce((sum, r) => sum + (r.duration_ms || 0), 0);

    // This week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const recordingsThisWeek = recordings.filter(r =>
      new Date(r.created_at) >= weekStart
    ).length;

    console.log('[SettingsService] Stats calculated:', { totalRecordings, totalDuration, recordingsThisWeek });
    return {
      data: {
        totalRecordings,
        totalDuration,
        recordingsThisWeek
      },
      error: null
    };
  } catch (error) {
    console.error('[SettingsService] Error fetching stats:', error);
    return { data: null, error };
  }
};
