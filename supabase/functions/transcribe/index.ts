// Supabase Edge Function: Transcribe audio using OpenAI Whisper API
// Deno runtime

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface TranscriptionRequest {
  recordingId: string;
  audioFilePath: string;
  language?: string;
}

interface TranscriptionResponse {
  transcriptionId: string;
  text: string;
  confidence: number;
  wordCount: number;
  processingTime: number;
}

serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[Transcribe] Function invoked');

    // Validate environment variables
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured');
    }

    // Parse request
    const { recordingId, audioFilePath, language = 'en' }: TranscriptionRequest = await req.json();

    if (!recordingId || !audioFilePath) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: recordingId, audioFilePath' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Transcribe] Processing:', { recordingId, audioFilePath, language });

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Update recording status to 'transcribing'
    await supabase
      .from('recordings')
      .update({ status: 'transcribing' })
      .eq('id', recordingId);

    // Download audio file from Supabase Storage
    console.log('[Transcribe] Downloading audio from storage');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('audio-recordings')
      .download(audioFilePath);

    if (downloadError) {
      console.error('[Transcribe] Download error:', downloadError);
      throw new Error(`Failed to download audio: ${downloadError.message}`);
    }

    // Convert Blob to File for OpenAI API
    const audioFile = new File([fileData], 'audio.webm', { type: 'audio/webm' });

    // Call OpenAI Whisper API
    console.log('[Transcribe] Calling Whisper API');
    const startTime = Date.now();

    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    formData.append('language', language);
    formData.append('response_format', 'verbose_json'); // Get word-level timestamps and confidence

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorData = await whisperResponse.json();
      console.error('[Transcribe] Whisper API error:', errorData);
      throw new Error(`Whisper API error: ${errorData.error?.message || whisperResponse.statusText}`);
    }

    const whisperData = await whisperResponse.json();
    const processingTime = Date.now() - startTime;

    console.log('[Transcribe] Whisper API success:', {
      textLength: whisperData.text?.length,
      processingTime,
    });

    // Calculate metrics
    const transcriptText = whisperData.text || '';
    const wordCount = transcriptText.split(/\s+/).filter((word: string) => word.length > 0).length;

    // Estimate confidence (Whisper doesn't provide overall confidence in verbose_json)
    // We'll use a heuristic: longer transcripts with clear words tend to be more confident
    const confidence = Math.min(0.95, 0.7 + (wordCount / 1000) * 0.2);

    // Calculate API cost (Whisper: $0.006 per minute)
    const durationMinutes = (whisperData.duration || 0) / 60;
    const apiCost = durationMinutes * 0.006;

    // Get user_id from recording
    const { data: recordingData, error: recordingError } = await supabase
      .from('recordings')
      .select('user_id')
      .eq('id', recordingId)
      .single();

    if (recordingError) {
      console.error('[Transcribe] Error fetching recording:', recordingError);
      throw new Error('Failed to fetch recording data');
    }

    // Save transcription to database
    console.log('[Transcribe] Saving transcription to database');
    const { data: transcriptionData, error: insertError } = await supabase
      .from('transcriptions')
      .insert({
        recording_id: recordingId,
        user_id: recordingData.user_id,
        transcript_text: transcriptText,
        language,
        confidence_score: confidence,
        processing_time_ms: processingTime,
        word_count: wordCount,
        api_provider: 'openai_whisper',
        api_cost: apiCost,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Transcribe] Insert error:', insertError);
      throw new Error(`Failed to save transcription: ${insertError.message}`);
    }

    // Update recording status to 'transcribed'
    await supabase
      .from('recordings')
      .update({ status: 'transcribed' })
      .eq('id', recordingId);

    console.log('[Transcribe] Success:', { transcriptionId: transcriptionData.id });

    // Trigger analysis function (fire and forget)
    const analysisUrl = `${SUPABASE_URL}/functions/v1/analyze`;
    fetch(analysisUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        transcriptionId: transcriptionData.id,
        recordingId,
      }),
    }).catch((err) => console.error('[Transcribe] Failed to trigger analysis:', err));

    // Return response
    const response: TranscriptionResponse = {
      transcriptionId: transcriptionData.id,
      text: transcriptText,
      confidence,
      wordCount,
      processingTime,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Transcribe] Error:', error);

    // Update recording status to 'failed'
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const body = await req.json().catch(() => ({}));
      if (body.recordingId) {
        await supabase
          .from('recordings')
          .update({
            status: 'failed',
            error_message: error.message || 'Transcription failed',
          })
          .eq('id', body.recordingId);
      }
    }

    return new Response(
      JSON.stringify({
        error: error.message || 'Transcription failed',
        details: error.toString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
