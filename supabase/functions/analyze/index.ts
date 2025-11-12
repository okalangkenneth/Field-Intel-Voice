// Supabase Edge Function: Analyze transcription using GPT-4
// Extract contacts, action items, sentiment, buying signals

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface AnalyzeRequest {
  transcriptionId: string;
  recordingId: string;
}

// GPT-4 extraction prompt
const EXTRACTION_PROMPT = `You are an AI assistant analyzing sales call transcripts to extract structured CRM data.

Analyze the following sales call transcript and extract:

1. **Contacts**: People mentioned (name, title, company, email, phone if available)
2. **Companies**: Companies discussed (name, industry, size estimate)
3. **Action Items**: Tasks to follow up on (task description, due date if mentioned, priority)
4. **Dates**: Important dates mentioned (date, context)
5. **Buying Signals**: Indicators of purchase intent (signal description, strength: high/medium/low)
6. **Sentiment**: Overall conversation tone (positive/neutral/negative/urgent)
7. **Summary**: 2-3 sentence summary of the conversation
8. **Key Points**: Most important points discussed
9. **Next Steps**: Recommended follow-up actions

For each extracted item, provide a confidence score (0.0 to 1.0).

Return ONLY valid JSON in this exact format:
{
  "contacts": [
    {
      "name": "string",
      "title": "string",
      "company": "string",
      "email": "string | null",
      "phone": "string | null",
      "confidence": 0.95
    }
  ],
  "companies": [
    {
      "name": "string",
      "industry": "string | null",
      "size": "string | null",
      "confidence": 0.90
    }
  ],
  "action_items": [
    {
      "task": "string",
      "due_date": "YYYY-MM-DD | null",
      "priority": "high | medium | low",
      "confidence": 0.85
    }
  ],
  "dates": [
    {
      "date": "YYYY-MM-DD",
      "context": "string",
      "confidence": 0.90
    }
  ],
  "buying_signals": [
    {
      "signal": "string",
      "strength": "high | medium | low",
      "confidence": 0.80
    }
  ],
  "overall_sentiment": "positive | neutral | negative | urgent",
  "sentiment_score": 0.75,
  "sentiment_explanation": "string",
  "summary": "string",
  "key_points": [
    {
      "point": "string",
      "importance": "high | medium | low"
    }
  ],
  "next_steps": "string",
  "confidence_score": 0.85
}

Transcript:
---
{{TRANSCRIPT}}
---

Extract the data now:`;

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[Analyze] Function invoked');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured');
    }

    const { transcriptionId, recordingId }: AnalyzeRequest = await req.json();

    if (!transcriptionId || !recordingId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: transcriptionId, recordingId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Analyze] Processing:', { transcriptionId, recordingId });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Update recording status
    await supabase
      .from('recordings')
      .update({ status: 'analyzing' })
      .eq('id', recordingId);

    // Fetch transcription
    const { data: transcriptionData, error: transcriptionError } = await supabase
      .from('transcriptions')
      .select('transcript_text, user_id')
      .eq('id', transcriptionId)
      .single();

    if (transcriptionError || !transcriptionData) {
      throw new Error('Failed to fetch transcription');
    }

    const transcript = transcriptionData.transcript_text;
    console.log('[Analyze] Transcript length:', transcript.length);

    // Call GPT-4 API
    console.log('[Analyze] Calling GPT-4 API');
    const startTime = Date.now();

    const prompt = EXTRACTION_PROMPT.replace('{{TRANSCRIPT}}', transcript);

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a sales CRM data extraction expert. Extract structured data from sales call transcripts.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1, // Low temperature for consistency
        response_format: { type: 'json_object' },
      }),
    });

    if (!gptResponse.ok) {
      const errorData = await gptResponse.json();
      console.error('[Analyze] GPT-4 error:', errorData);
      throw new Error(`GPT-4 error: ${errorData.error?.message || gptResponse.statusText}`);
    }

    const gptData = await gptResponse.json();
    const processingTime = Date.now() - startTime;

    console.log('[Analyze] GPT-4 success, processing time:', processingTime);

    // Parse extracted data
    const extractedData = JSON.parse(gptData.choices[0].message.content);

    // Calculate API cost (GPT-4 Turbo: ~$0.01/1K input tokens, ~$0.03/1K output tokens)
    const inputTokens = gptData.usage?.prompt_tokens || 0;
    const outputTokens = gptData.usage?.completion_tokens || 0;
    const apiCost = (inputTokens / 1000) * 0.01 + (outputTokens / 1000) * 0.03;

    console.log('[Analyze] Extracted data:', {
      contacts: extractedData.contacts?.length || 0,
      companies: extractedData.companies?.length || 0,
      actionItems: extractedData.action_items?.length || 0,
      sentiment: extractedData.overall_sentiment,
    });

    // Save analysis results to database
    console.log('[Analyze] Saving analysis results');
    const { data: analysisData, error: insertError } = await supabase
      .from('analysis_results')
      .insert({
        transcription_id: transcriptionId,
        recording_id: recordingId,
        user_id: transcriptionData.user_id,
        contacts: extractedData.contacts || [],
        companies: extractedData.companies || [],
        action_items: extractedData.action_items || [],
        dates: extractedData.dates || [],
        buying_signals: extractedData.buying_signals || [],
        overall_sentiment: extractedData.overall_sentiment || 'neutral',
        sentiment_score: extractedData.sentiment_score || 0,
        sentiment_explanation: extractedData.sentiment_explanation || '',
        summary: extractedData.summary || '',
        key_points: extractedData.key_points || [],
        next_steps: extractedData.next_steps || '',
        confidence_score: extractedData.confidence_score || 0,
        processing_time_ms: processingTime,
        api_cost: apiCost,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Analyze] Insert error:', insertError);
      throw new Error(`Failed to save analysis: ${insertError.message}`);
    }

    // Update recording status to 'analyzed'
    await supabase
      .from('recordings')
      .update({ status: 'analyzed' })
      .eq('id', recordingId);

    console.log('[Analyze] Success:', { analysisId: analysisData.id });

    // Check if should auto-sync to CRM
    const shouldAutoSync =
      extractedData.confidence_score >= 0.8 && extractedData.contacts?.length > 0;

    if (shouldAutoSync) {
      console.log('[Analyze] Triggering auto-sync to CRM');
      const syncUrl = `${SUPABASE_URL}/functions/v1/crm-sync`;
      fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          analysisId: analysisData.id,
          recordingId,
        }),
      }).catch((err) => console.error('[Analyze] Failed to trigger CRM sync:', err));
    }

    return new Response(
      JSON.stringify({
        analysisId: analysisData.id,
        ...extractedData,
        processingTime,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Analyze] Error:', error);

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const body = await req.json().catch(() => ({}));
      if (body.recordingId) {
        await supabase
          .from('recordings')
          .update({
            status: 'failed',
            error_message: `Analysis failed: ${error.message}`,
          })
          .eq('id', body.recordingId);
      }
    }

    return new Response(
      JSON.stringify({
        error: error.message || 'Analysis failed',
        details: error.toString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
