/**
 * Dashboard service - Fetch team metrics and analytics
 */

import { supabase } from '../lib/supabase.js';

/**
 * Get dashboard metrics for manager
 */
export const getDashboardMetrics = async () => {
  console.log('[DashboardService] Fetching dashboard metrics');

  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const weekStart = new Date(now.setDate(now.getDate() - 7)).toISOString();

    // Get all recordings with analysis
    const { data: recordings, error: recordingsError } = await supabase
      .from('recordings')
      .select(`
        id,
        user_id,
        duration_ms,
        status,
        created_at,
        user_profiles (
          email,
          full_name
        ),
        analysis_results (
          overall_sentiment,
          confidence_score,
          contacts,
          action_items,
          buying_signals
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (recordingsError) throw recordingsError;

    // Calculate metrics
    const totalRecordings = recordings.length;
    const recordingsToday = recordings.filter(r => r.created_at >= todayStart).length;
    const recordingsThisWeek = recordings.filter(r => r.created_at >= weekStart).length;

    // Sentiment distribution
    const sentiments = recordings
      .map(r => r.analysis_results?.[0]?.overall_sentiment)
      .filter(Boolean);

    const sentimentCounts = {
      positive: sentiments.filter(s => s === 'positive').length,
      neutral: sentiments.filter(s => s === 'neutral').length,
      negative: sentiments.filter(s => s === 'negative').length,
      urgent: sentiments.filter(s => s === 'urgent').length,
    };

    // Average confidence
    const confidenceScores = recordings
      .map(r => r.analysis_results?.[0]?.confidence_score)
      .filter(Boolean);
    const avgConfidence = confidenceScores.length > 0
      ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
      : 0;

    // Total contacts extracted
    const totalContacts = recordings
      .flatMap(r => r.analysis_results?.[0]?.contacts || [])
      .length;

    // Total action items
    const totalActionItems = recordings
      .flatMap(r => r.analysis_results?.[0]?.action_items || [])
      .length;

    // Buying signals
    const totalBuyingSignals = recordings
      .flatMap(r => r.analysis_results?.[0]?.buying_signals || [])
      .length;

    // User activity (top performers)
    const userActivity = {};
    recordings.forEach(r => {
      const userId = r.user_id;
      if (!userActivity[userId]) {
        userActivity[userId] = {
          userId,
          email: r.user_profiles?.email || 'Unknown',
          fullName: r.user_profiles?.full_name || 'Unknown',
          count: 0,
          totalDuration: 0,
        };
      }
      userActivity[userId].count++;
      userActivity[userId].totalDuration += r.duration_ms || 0;
    });

    const topPerformers = Object.values(userActivity)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    console.log('[DashboardService] Metrics calculated:', {
      totalRecordings,
      recordingsToday,
      sentimentCounts,
    });

    return {
      data: {
        totalRecordings,
        recordingsToday,
        recordingsThisWeek,
        sentimentCounts,
        avgConfidence,
        totalContacts,
        totalActionItems,
        totalBuyingSignals,
        topPerformers,
        recentActivity: recordings.slice(0, 10),
      },
      error: null,
    };
  } catch (error) {
    console.error('[DashboardService] Error:', error);
    return { data: null, error };
  }
};

/**
 * Get recent contacts extracted across all recordings
 */
export const getRecentContacts = async (limit = 20) => {
  console.log('[DashboardService] Fetching recent contacts');

  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .select(`
        id,
        contacts,
        created_at,
        recording_id,
        recordings (
          user_id,
          user_profiles (
            email,
            full_name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Flatten contacts
    const allContacts = [];
    data.forEach(analysis => {
      const contacts = analysis.contacts || [];
      contacts.forEach(contact => {
        allContacts.push({
          ...contact,
          extractedAt: analysis.created_at,
          extractedBy: analysis.recordings?.user_profiles?.full_name || 'Unknown',
          recordingId: analysis.recording_id,
        });
      });
    });

    console.log('[DashboardService] Recent contacts:', allContacts.length);
    return { data: allContacts.slice(0, limit), error: null };
  } catch (error) {
    console.error('[DashboardService] Error:', error);
    return { data: null, error };
  }
};

/**
 * Subscribe to real-time updates
 */
export const subscribeToDashboardUpdates = (callback) => {
  console.log('[DashboardService] Subscribing to real-time updates');

  const channel = supabase
    .channel('dashboard-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'recordings',
      },
      (payload) => {
        console.log('[DashboardService] Recordings updated:', payload);
        callback('recordings', payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'analysis_results',
      },
      (payload) => {
        console.log('[DashboardService] Analysis updated:', payload);
        callback('analysis', payload);
      }
    )
    .subscribe();

  return () => {
    console.log('[DashboardService] Unsubscribing from real-time updates');
    supabase.removeChannel(channel);
  };
};
