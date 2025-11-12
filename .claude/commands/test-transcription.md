# /test-transcription - Test Whisper API Integration

## Purpose
Test the OpenAI Whisper transcription with sample audio files to verify API connectivity, accuracy, and latency.

## Parameters
- `file`: Path to audio file (optional, uses sample if not provided)
- `language`: Language code (optional, default: 'en')
- `model`: Whisper model (optional, default: 'whisper-1')

## Actions
1. Check if OPENAI_API_KEY is configured
2. Load sample audio file or use provided file
3. Call Whisper API with audio
4. Display transcription result
5. Show accuracy metrics (if reference text available)
6. Display API response time and cost estimate

## Example Usage
```
/test-transcription
/test-transcription file=./samples/sales-call.mp3
/test-transcription file=./samples/noisy-recording.wav language=en
```

## Expected Output
```
✅ Transcription Test Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Audio File: sales-call.mp3
Duration: 2m 34s
File Size: 1.8 MB

API Response Time: 3.2s
Cost Estimate: $0.015

Transcription:
"Hey John, thanks for meeting with me today. I wanted to follow up on our 
conversation about the new software solution. You mentioned you're looking 
to reduce manual data entry by about 50%. Let me show you how our platform 
can help..."

Confidence: High
Words: 287
Sentiment: Positive
```

## Safety Checks
- Verify API key is not exposed in logs
- Ensure audio file exists and is valid format
- Check file size (max 25MB for Whisper)
- Validate API response before processing
- Handle rate limiting gracefully

## Success Criteria
- ✅ API responds in <5 seconds for 5-minute audio
- ✅ Transcription accuracy >95% for clear audio
- ✅ Proper error handling for invalid files
- ✅ Cost tracking working correctly
