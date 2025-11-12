/**
 * Recording service - Upload audio to Supabase and trigger transcription
 */

import { supabase, supabaseHelpers } from '../lib/supabase.js';
import { apiCall } from '../lib/api.js';

/**
 * Save recording to Supabase
 * 1. Upload audio file to Supabase Storage
 * 2. Create recording record in database
 * 3. Trigger transcription Edge Function
 */
export const saveRecording = async (audioBlob, durationMs) => {
  console.log('[RecordingService] Saving recording:', {
    size: audioBlob.size,
    type: audioBlob.type,
    duration: durationMs,
  });

  try {
    // Get current user
    const { user, error: userError } = await supabaseHelpers.getCurrentUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('[RecordingService] User authenticated:', user.id);

    // Create unique filename
    const timestamp = Date.now();
    const fileName = `${user.id}/${timestamp}-recording.webm`;

    // Convert blob to File
    const audioFile = new File([audioBlob], fileName, { type: audioBlob.type });

    // Upload to Supabase Storage
    console.log('[RecordingService] Uploading audio to storage');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-recordings')
      .upload(fileName, audioFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[RecordingService] Upload error:', uploadError);
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }

    console.log('[RecordingService] Audio uploaded:', uploadData.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio-recordings')
      .getPublicUrl(uploadData.path);

    // Create recording record in database
    console.log('[RecordingService] Creating recording record');
    const { data: recordingData, error: recordingError } = await supabase
      .from('recordings')
      .insert({
        user_id: user.id,
        audio_file_path: uploadData.path,
        audio_file_url: urlData.publicUrl,
        duration_ms: durationMs,
        file_size_bytes: audioBlob.size,
        mime_type: audioBlob.type,
        status: 'completed',
        metadata: {
          recorded_at: new Date().toISOString(),
          browser: navigator.userAgent,
        },
      })
      .select()
      .single();

    if (recordingError) {
      console.error('[RecordingService] Database error:', recordingError);
      // Cleanup uploaded file
      await supabase.storage.from('audio-recordings').remove([uploadData.path]);
      throw new Error(`Failed to save recording: ${recordingError.message}`);
    }

    console.log('[RecordingService] Recording saved:', recordingData.id);

    // Trigger transcription Edge Function
    console.log('[RecordingService] Triggering transcription');
    const { data: transcriptionData, error: transcriptionError } = await apiCall(
      '/transcribe',
      {
        method: 'POST',
        body: JSON.stringify({
          recordingId: recordingData.id,
          audioFilePath: uploadData.path,
          language: 'en',
        }),
      }
    );

    if (transcriptionError) {
      console.error('[RecordingService] Transcription trigger error:', transcriptionError);
      // Don't throw - recording is saved, transcription can be retried
      return {
        success: true,
        recordingId: recordingData.id,
        transcriptionTriggered: false,
        error: transcriptionError.message,
      };
    }

    console.log('[RecordingService] Transcription triggered:', transcriptionData);

    return {
      success: true,
      recordingId: recordingData.id,
      transcriptionId: transcriptionData?.transcriptionId,
      transcriptionTriggered: true,
    };
  } catch (error) {
    console.error('[RecordingService] Error:', error);
    throw error;
  }
};

/**
 * Get recording by ID with transcription and analysis
 */
export const getRecording = async (recordingId) => {
  console.log('[RecordingService] Fetching recording:', recordingId);

  try {
    const { data, error } = await supabase
      .from('recordings')
      .select(
        `
        *,
        transcriptions (*),
        analysis_results (*)
      `
      )
      .eq('id', recordingId)
      .single();

    if (error) {
      console.error('[RecordingService] Fetch error:', error);
      throw new Error(`Failed to fetch recording: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error('[RecordingService] Error:', error);
    return { data: null, error };
  }
};

/**
 * Get all recordings for current user
 */
export const getRecordings = async (limit = 50) => {
  console.log('[RecordingService] Fetching recordings, limit:', limit);

  try {
    const { user, error: userError } = await supabaseHelpers.getCurrentUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('recordings')
      .select(
        `
        *,
        transcriptions (
          id,
          transcript_text,
          confidence_score,
          word_count
        ),
        analysis_results (
          id,
          overall_sentiment,
          confidence_score,
          summary
        )
      `
      )
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[RecordingService] Fetch error:', error);
      throw new Error(`Failed to fetch recordings: ${error.message}`);
    }

    console.log('[RecordingService] Fetched recordings:', data.length);
    return { data, error: null };
  } catch (error) {
    console.error('[RecordingService] Error:', error);
    return { data: null, error };
  }
};

/**
 * Delete recording (soft delete for GDPR compliance)
 */
export const deleteRecording = async (recordingId) => {
  console.log('[RecordingService] Deleting recording:', recordingId);

  try {
    // Soft delete
    const { error } = await supabase
      .from('recordings')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', recordingId);

    if (error) {
      console.error('[RecordingService] Delete error:', error);
      throw new Error(`Failed to delete recording: ${error.message}`);
    }

    console.log('[RecordingService] Recording deleted');
    return { success: true, error: null };
  } catch (error) {
    console.error('[RecordingService] Error:', error);
    return { success: false, error };
  }
};

/**
 * Subscribe to recording status updates
 */
export const subscribeToRecording = (recordingId, callback) => {
  console.log('[RecordingService] Subscribing to recording updates:', recordingId);

  const channel = supabase
    .channel(`recording:${recordingId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'recordings',
        filter: `id=eq.${recordingId}`,
      },
      (payload) => {
        console.log('[RecordingService] Recording updated:', payload.new.status);
        callback(payload.new);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    console.log('[RecordingService] Unsubscribing from recording updates');
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to transcription completion
 */
export const subscribeToTranscription = (recordingId, callback) => {
  console.log('[RecordingService] Subscribing to transcription updates:', recordingId);

  const channel = supabase
    .channel(`transcription:${recordingId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'transcriptions',
        filter: `recording_id=eq.${recordingId}`,
      },
      (payload) => {
        console.log('[RecordingService] Transcription created');
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    console.log('[RecordingService] Unsubscribing from transcription updates');
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to analysis completion
 */
export const subscribeToAnalysis = (recordingId, callback) => {
  console.log('[RecordingService] Subscribing to analysis updates:', recordingId);

  const channel = supabase
    .channel(`analysis:${recordingId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'analysis_results',
        filter: `recording_id=eq.${recordingId}`,
      },
      (payload) => {
        console.log('[RecordingService] Analysis created');
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    console.log('[RecordingService] Unsubscribing from analysis updates');
    supabase.removeChannel(channel);
  };
};
