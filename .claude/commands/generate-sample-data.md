# /generate-sample-data - Create Mock Voice Notes

## Purpose
Generate realistic sample voice note data for testing and demo purposes without actual recording.

## Parameters
- `count`: Number of samples to generate (default: 5)
- `type`: Sample type (sales-call | client-meeting | follow-up | all)
- `include_audio`: Generate mock audio files (true | false) - default: false

## Actions
1. Generate realistic transcripts based on type
2. Create corresponding AI extraction data (contacts, sentiment, action items)
3. Add timestamps and metadata
4. Save to database or return JSON
5. Optionally generate mock audio waveforms for UI testing

## Example Usage
```
/generate-sample-data
/generate-sample-data count=10 type=sales-call
/generate-sample-data count=3 type=all include_audio=true
```

## Sample Data Templates

### Sales Call
```json
{
  "id": "note_001",
  "timestamp": "2025-11-12T14:30:00Z",
  "duration": 180,
  "transcript": "Just finished meeting with Sarah Johnson at TechCorp...",
  "extracted": {
    "contacts": [
      {
        "name": "Sarah Johnson",
        "title": "VP of Sales",
        "company": "TechCorp",
        "email": "sarah.j@techcorp.com",
        "confidence": 0.95
      }
    ],
    "sentiment": "positive",
    "urgency": "high",
    "buying_signals": ["ready to buy", "budget approved"],
    "action_items": [
      {
        "task": "Send proposal by Friday",
        "due_date": "2025-11-15",
        "confidence": 0.92
      }
    ]
  }
}
```

## Success Criteria
- ✅ Generates realistic, varied data
- ✅ Includes high and low confidence scores
- ✅ Covers positive, neutral, negative sentiment
- ✅ Action items have realistic dates
- ✅ Contact data follows CRM field formats
