# Field Intel - Voice-to-CRM for Field Sales - CLAUDE CODE RULES

## PROJECT IDENTITY
**Project Type**: SaaS Web Application (Mobile-First Progressive Web App)
**Primary Goal**: Convert voice notes from field sales reps into structured CRM data automatically
**Target Users**: Field sales representatives (5-50 person teams) who spend hours on manual CRM data entry

## TECH STACK
- **Framework**: Vite + React (PWA for mobile-first experience)
- **Language**: JavaScript (ES6+, no TypeScript)
- **Styling**: Inline styles (no CSS frameworks)
- **Database**: PostgreSQL via Supabase
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **AI Services**: OpenAI Whisper API (transcription) + GPT-4 (analysis)
- **Audio**: Web Audio API + MediaRecorder API
- **CRM Integration**: REST APIs (Salesforce, HubSpot, Pipedrive)
- **Deployment**: Vercel (with PWA support)

---

## 🚨 CRITICAL RULES - READ BEFORE EVERY ACTION

### 1. ALWAYS ASK CLARIFYING QUESTIONS
- **If you are less than 90% confident about ANY aspect, ASK FIRST**
- Never assume what I want
- Examples:
  - "Should voice recording work offline or require connection?"
  - "Should we auto-save drafts or require manual save?"
  - "Which CRM integration should we prioritize first?"
  - "How should we handle recording failures?"

### 2. NEVER MAKE UNAUTHORIZED CHANGES
- **ONLY modify what is explicitly requested**
- **NEVER refactor unrelated code**
- **NEVER change file structure unless asked**
- **NEVER "improve" code that wasn't mentioned**
- If you think something else should change, **ASK PERMISSION FIRST**

### 3. NO PLACEHOLDERS - EVER
- **NEVER use**: `YOUR_API_KEY`, `TODO`, `FIXME`, `placeholder`, `example`, etc.
- **ALWAYS use**: environment variables, config files, or real values
- If you need real values, **ASK FOR THEM**
- Examples:
  - ❌ `const apiKey = "YOUR_OPENAI_KEY";`
  - ✅ `const apiKey = import.meta.env.VITE_OPENAI_API_KEY;`

### 4. DEPENDENCY MANAGEMENT IS MANDATORY
- **ALWAYS** update package.json when adding imports
- **NEVER** import a library without adding it to dependencies
- **VERIFY** all dependencies exist before suggesting code
- Run explicit install commands

### 5. SECURITY IS NON-NEGOTIABLE
- **NEVER** put API keys, secrets, or credentials in client-side code
- **NEVER** commit secrets to git
- **ALWAYS** use environment variables for sensitive data
- **ALWAYS** implement proper authentication and authorization
- **ALWAYS** validate and sanitize user inputs
- Create .env.example (safe) and .env.local (gitignored)

**Critical for this project:**
- OpenAI API keys MUST be server-side only
- CRM OAuth tokens MUST be encrypted at rest
- Audio files MUST be deleted after processing (GDPR compliance)
- User voice data MUST have explicit consent

### 6. QUESTIONS VS CODE REQUESTS
- If I ask "Why did you do X?" → **ANSWER**, don't change code
- If I ask "What does this do?" → **EXPLAIN**, don't rewrite
- Only modify code when I say: "change", "update", "fix", "add", "remove", "refactor"
- **NEVER** assume a question means "rewrite this"

### 7. PROVIDE MULTIPLE OPTIONS FOR DECISIONS
When facing a significant choice, provide 2-3 options with pros/cons:
```
Option A: Use OpenAI Whisper API
  Pros: Best accuracy, handles noisy environments well
  Cons: $0.006/minute, requires internet connection

Option B: Use Web Speech API (browser native)
  Pros: Free, works offline, fast
  Cons: Lower accuracy, browser-dependent

Option C: Hybrid approach
  Pros: Best of both worlds
  Cons: More complex implementation

Which would you prefer?
```

### 8. SAVE DECISIONS TO MEMORY
When I make a decision, save it using the `#` command:
- Example: "Use OpenAI Whisper for transcription" → Save permanently
- Example: "Salesforce integration is priority #1" → Remember for all CRM work
- Example: "Max recording length is 5 minutes" → Use in all recording components

### 9. EXIT EARLY IF WRONG PATH
- If you realize you're going down the wrong path, **STOP IMMEDIATELY**
- Say: "Hold on, I think I misunderstood. Let me clarify..."
- **Don't finish generating wrong code hoping it works out**
- It's better to stop and ask than to create more work

### 10. INTELLIGENT LOGGING
**ALWAYS** add appropriate logging for this domain:
- Voice recording events (start, stop, pause, resume, error)
- Transcription API calls (request, response, errors, latency)
- AI extraction results (contacts found, sentiment, confidence scores)
- CRM sync attempts (success, failure, retry counts)
- User interactions (button clicks, form submissions, navigation)

Use appropriate levels:
- `console.error()` for failures (recording failed, API errors, CRM sync failures)
- `console.warn()` for potential issues (low audio quality, missing permissions)
- `console.log()` for key events (recording started, transcription complete, CRM synced)
- `console.debug()` for detailed flow (audio chunks, processing steps)

Format: `console.log('[Component/Module] Action:', data)`
Example: `console.log('[VoiceRecorder] Recording started:', { duration: 0, quality: 'high' })`

### 11. EVIDENCE-BASED RESPONSES
When asked "Is X implemented?", show the code:
```
Looking at src/components/VoiceRecorder.jsx (lines 45-62):
[show actual code snippet]

Yes, the recording permission check is implemented.
```
- **NEVER** guess or assume
- If unsure, say: "Let me check the file..."
- Always provide file names and line numbers when referencing code

### 12. CLEAN UP CODE AUTOMATICALLY
- Remove unused imports
- Delete commented-out code (unless marked to keep)
- Remove debug console.logs before final commit
- Clean up temporary variables
- Remove orphaned functions

### 13. PRESERVE FUNCTIONAL REQUIREMENTS
- **NEVER** change core functionality to "fix" errors
- When encountering errors, fix the technical issue, not the requirements
- If requirements seem problematic, **ASK** before changing them
- Document any necessary requirement clarifications

### 14. CAPABILITY HONESTY
- **NEVER** attempt to generate audio files or voice models
- If asked for capabilities you don't have, state limitations clearly
- **NEVER** create fake implementations of impossible features
- Suggest proper alternatives using appropriate APIs/services

### 15. NO HARDCODED EXAMPLES IN PRODUCTION
- **NEVER** hardcode example values as permanent solutions
- **ALWAYS** use variables, parameters, or configuration for dynamic values
- If showing examples, clearly mark them as examples, not implementation
- Example data should be in separate mock/seed files

### 16. TYPOGRAPHY SYSTEM - MANDATORY
- **ALWAYS** use the Inter font typography system for all projects
- **ALWAYS** import typography styles from `src/styles/typography.js`
- **NEVER** use arbitrary font sizes - use the predefined typography scale
- **ALWAYS** add Google Fonts link to `index.html` for Inter font
- **ALWAYS** apply global font styles in `main.jsx`
- Use semantic HTML with typography styles: `<h1 style={typography.h1}>`
- For custom styling, spread typography object: `{...typography.body, color: customColor}`

---

## 📋 BEFORE EVERY RESPONSE CHECKLIST

Before responding, verify:
- [ ] Did I ask clarifying questions if <90% confident?
- [ ] Am I only changing what was explicitly requested?
- [ ] Are all new imports added to package.json?
- [ ] Are there any placeholders that need real values?
- [ ] Is this a question (answer) or code request (modify)?
- [ ] Did I provide multiple options for significant decisions?
- [ ] Are API keys/secrets properly handled with env vars?
- [ ] Did I add appropriate logging for audio/AI/CRM operations?
- [ ] Did I use the typography system (Inter font) for text styles?
- [ ] Can I provide code evidence for any claims?
- [ ] Did I clean up unused code?
- [ ] Am I preserving all functional requirements?
- [ ] Have I been honest about my capabilities?

---

## 🛠️ PROJECT STRUCTURE

```
field-intel/
├── src/
│   ├── components/
│   │   ├── voice/           # Voice recording components
│   │   │   ├── VoiceRecorder.jsx
│   │   │   ├── AudioVisualizer.jsx
│   │   │   └── RecordingControls.jsx
│   │   ├── transcription/   # Transcription display
│   │   │   ├── TranscriptView.jsx
│   │   │   └── EditableTranscript.jsx
│   │   ├── analysis/        # AI analysis results
│   │   │   ├── ContactsExtracted.jsx
│   │   │   ├── ActionItems.jsx
│   │   │   └── SentimentBadge.jsx
│   │   ├── crm/             # CRM integration UI
│   │   │   ├── CRMConnector.jsx
│   │   │   ├── SyncStatus.jsx
│   │   │   └── FieldMapping.jsx
│   │   ├── dashboard/       # Manager dashboard
│   │   │   ├── ActivityFeed.jsx
│   │   │   ├── SentimentHeatmap.jsx
│   │   │   └── TeamMetrics.jsx
│   │   └── common/          # Shared components
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       └── LoadingSpinner.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Record.jsx
│   │   ├── History.jsx
│   │   ├── Dashboard.jsx
│   │   └── Settings.jsx
│   ├── services/
│   │   ├── audio.js         # Audio recording logic
│   │   ├── transcription.js # Whisper API integration
│   │   ├── analysis.js      # GPT-4 extraction
│   │   ├── crm/
│   │   │   ├── salesforce.js
│   │   │   ├── hubspot.js
│   │   │   └── pipedrive.js
│   │   └── storage.js       # Supabase storage
│   ├── lib/
│   │   ├── supabase.js      # Supabase client
│   │   ├── api.js           # API utilities
│   │   └── auth.js          # Auth helpers
│   ├── utils/
│   │   ├── audio-processing.js
│   │   ├── formatters.js
│   │   └── validators.js
│   ├── config/
│   │   ├── constants.js
│   │   └── crm-schemas.js
│   ├── styles/
│   │   ├── typography.js
│   │   └── colors.js
│   └── hooks/
│       ├── useVoiceRecorder.js
│       ├── useTranscription.js
│       └── useCRMSync.js
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── service-worker.js    # Offline support
│   └── icons/               # App icons
├── supabase/
│   ├── migrations/          # Database schema
│   └── functions/           # Edge functions
│       ├── transcribe/
│       ├── analyze/
│       └── crm-sync/
├── tests/
├── .env.example
├── .env.local
└── package.json
```

---

## 🎨 DESIGN SYSTEM

### Typography - Professional Font System

**ALWAYS use this typography system for all text in the application.**

#### Font Setup (Add to index.html)
```html
<!-- Google Fonts - Inter -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

#### Typography Scale (Mobile-First)
```javascript
// src/styles/typography.js
export const typography = {
  display: {
    fontSize: '28px',           // Hero sections
    fontWeight: 700,
    lineHeight: '1.1',
  },
  h1: {
    fontSize: '24px',           // Page titles
    fontWeight: 700,
    lineHeight: '1.2',
  },
  h2: {
    fontSize: '20px',           // Section headings
    fontWeight: 600,
    lineHeight: '1.3',
  },
  h3: {
    fontSize: '18px',           // Subsections
    fontWeight: 600,
    lineHeight: '1.4',
  },
  body: {
    fontSize: '16px',           // Default text
    fontWeight: 400,
    lineHeight: '1.6',
  },
  bodySmall: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '1.5',
  },
  caption: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '1.4',
  },
  button: {
    fontSize: '16px',
    fontWeight: 500,
  },
};
```

### Colors
```javascript
// src/styles/colors.js
export const colors = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',    // Main brand color
    600: '#2563eb',
    700: '#1d4ed8',
  },
  success: {
    50: '#f0fdf4',
    500: '#22c55e',    // Recording, success states
    600: '#16a34a',
  },
  danger: {
    50: '#fef2f2',
    500: '#ef4444',    // Errors, warnings
    600: '#dc2626',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',    // Low confidence scores
  },
  neutral: {
    50: '#f9fafb',     // Backgrounds
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    500: '#6b7280',    // Secondary text
    700: '#374151',    // Primary text
    900: '#111827',    // Headings
  },
  // Sentiment colors
  sentiment: {
    positive: '#22c55e',
    neutral: '#6b7280',
    negative: '#ef4444',
    urgent: '#f59e0b',
  },
};
```

---

## 🔧 CODING STANDARDS

### General
- Use ES6+ features (const, arrow functions, destructuring, async/await)
- Prefer `const` over `let`, never use `var`
- Use async/await over promise chains
- Write descriptive variable names
- Comment complex logic, especially audio processing and AI prompts

### Component Pattern
```javascript
export function ComponentName({ props }) {
  // 1. Hooks and state
  const [state, setState] = useState(initial);
  
  // 2. Effects
  useEffect(() => {
    // Setup and side effects
  }, [dependencies]);
  
  // 3. Event handlers
  const handleAction = () => {
    // Handler logic
  };
  
  // 4. Render
  return <div>{/* JSX */}</div>;
}
```

### Audio Recording Standards
- Always check for MediaRecorder support before attempting recording
- Handle permission denials gracefully
- Provide visual feedback during recording (waveform, timer)
- Auto-stop recording after 5 minutes to save API costs
- Compress audio before upload (target: <1MB per minute)

### AI Integration Standards
- Always show confidence scores for extracted data
- Allow manual editing of AI results
- Implement retry logic for API failures
- Cache results to avoid duplicate API calls
- Rate limit to prevent abuse

### Testing Requirements
- Unit tests for audio processing utilities
- Integration tests for CRM API calls
- E2E tests for critical flows (record → transcribe → sync to CRM)
- Test offline mode thoroughly
- Test with various audio qualities and accents

---

## 🚀 COMMANDS

### Development
- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run test suite
- `npm run lint` - Lint code

### Supabase
- `npx supabase start` - Start local Supabase
- `npx supabase db push` - Push migrations to remote
- `npx supabase functions deploy [name]` - Deploy edge function

### Deployment
- `vercel` - Deploy to Vercel preview
- `vercel --prod` - Deploy to production

---

## 🔐 ENVIRONMENT VARIABLES

Required variables in `.env.local`:
```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # Server-side only

# OpenAI (Server-side only - use in Edge Functions)
OPENAI_API_KEY=sk-xxx...

# CRM Integrations (Server-side only)
SALESFORCE_CLIENT_ID=xxx
SALESFORCE_CLIENT_SECRET=xxx
SALESFORCE_REDIRECT_URI=https://yourapp.com/oauth/salesforce

HUBSPOT_CLIENT_ID=xxx
HUBSPOT_CLIENT_SECRET=xxx

PIPEDRIVE_CLIENT_ID=xxx
PIPEDRIVE_CLIENT_SECRET=xxx

# Feature Flags
VITE_ENABLE_OFFLINE_MODE=true
VITE_MAX_RECORDING_DURATION=300000  # 5 minutes in ms
VITE_AUTO_SYNC_TO_CRM=true
```

---

## 📱 RESPONSE PROTOCOLS

### When Uncertain About Audio/Voice Features
State: "I need clarification on [specific audio requirement] before implementing."
- Audio quality requirements?
- Supported audio formats?
- Background noise handling?
- Offline recording requirements?

### When Uncertain About AI Extraction
State: "I need clarification on [specific extraction requirement]."
- What data fields should be extracted?
- How should low-confidence results be handled?
- Should users be able to correct AI mistakes?
- What's the minimum confidence threshold?

### When Uncertain About CRM Integration
State: "I need to understand [specific CRM behavior]."
- Which CRM fields should be mapped?
- How should conflicts be resolved?
- Should we update existing records or create new?
- How should failed syncs be retried?

### When Asked "Are You Sure?"
1. Re-examine the code thoroughly
2. Test the implementation if possible
3. Provide specific evidence for your answer
4. If uncertain after re-examination, state: "Let me verify [specific aspect] in the documentation/code."

### Error Handling
For this project, special attention to:
- **Audio errors**: Permission denied, device unavailable, encoding failed
- **API errors**: Rate limits, timeouts, invalid responses
- **CRM errors**: Authentication failures, invalid data, sync conflicts
- **Network errors**: Offline mode, connection drops during recording

Always:
1. Log the full error with context
2. Show user-friendly error messages
3. Provide actionable next steps
4. Implement automatic retry where appropriate

---

## 🚫 VIOLATION CONSEQUENCES

Voice recording and CRM data are sensitive. Violations can:
- Lose user trust (privacy concerns)
- Violate GDPR/privacy laws (legal liability)
- Break production CRM data (customer data corruption)
- Cause financial loss (API overuse, failed recordings)
- Security breaches (exposed credentials, data leaks)

**CRITICAL: Never expose API keys, never store unencrypted voice data, always get user consent.**

---

## 🛑 EMERGENCY STOP PROTOCOL

If you're unsure about ANY aspect of a request:

1. **STOP** code generation immediately
2. **ASK** specific clarifying questions
3. **WAIT** for explicit confirmation
4. Only proceed when 100% certain

**This is especially critical for:**
- Audio recording permissions
- API key usage
- CRM data writes
- User data storage
- Privacy-sensitive features

---

## 📝 PROJECT-SPECIFIC NOTES

### Business Logic

**Recording Rules:**
- Maximum recording duration: 5 minutes (saves API costs)
- Auto-pause after 30 seconds of silence
- Minimum recording duration: 5 seconds
- Supported formats: WAV, MP3, M4A

**AI Extraction Rules:**
- Confidence threshold for auto-sync: 80%+
- Show low-confidence results for manual review
- Extract: contacts, companies, action items, dates, sentiment, buying signals
- Preserve original transcript + structured data separately

**CRM Sync Rules:**
- Create new contact if not found
- Update existing contact activity
- Set follow-up tasks with due dates
- Never overwrite user-entered data without confirmation
- Queue failed syncs for retry (3 attempts, exponential backoff)

### Performance Requirements
- Initial page load: <2 seconds
- Recording start latency: <200ms
- Transcription: <30 seconds for 5-minute recording
- CRM sync: <5 seconds
- Offline capability: Full recording + queue sync for later

### Privacy & Compliance
- GDPR compliant: User consent, right to delete, data export
- Audio files auto-deleted after 30 days
- Encrypted at rest and in transit
- No third-party analytics without consent
- Clear privacy policy and data handling

### Accessibility Requirements
- Voice control for hands-free operation
- Large touch targets for use while driving
- High contrast mode for outdoor visibility
- Screen reader support for manager dashboard
- Keyboard navigation for all features

### Browser/Device Support
- Chrome/Edge 90+ (Desktop + Mobile)
- Safari 14+ (iOS + macOS)
- Firefox 88+ (Desktop + Mobile)
- Progressive Web App installable on mobile
- Works on 4G connections (optimize for bandwidth)

---

## 🎯 PRIORITY ORDER FOR THIS PROJECT

1. **User Privacy & Security** - Never compromise on data protection
2. **Recording Reliability** - Must capture audio flawlessly
3. **Transcription Accuracy** - Core value proposition
4. **CRM Integration Stability** - Cannot corrupt customer CRM data
5. **Performance** - Must be fast enough for field use
6. **User Experience** - Simple enough to use while driving

---

## 📁 CLAUDE CODE PROJECT SETUP

### Slash Commands Created

Located in `.claude/commands/`:

1. **`/test-transcription`** - Test Whisper API with sample audio
2. **`/test-crm-sync`** - Test CRM integration without real data
3. **`/generate-sample-data`** - Create mock voice notes for testing
4. **`/analyze-audio-quality`** - Check audio file quality metrics
5. **`/validate-extraction`** - Verify AI extraction accuracy

### Subagents Created

Located in `.claude/agents/`:

1. **`@audio-expert`** - Audio recording, processing, compression specialist
2. **`@crm-specialist`** - CRM API integration and data mapping expert

---

## 🎯 DECISION LOG

| Date | Decision | Rationale | Who |
|------|----------|-----------|-----|
| 2025-11-12 | Use Vite + React as PWA | Faster than React Native, works on all mobile browsers | Kenneth |
| 2025-11-12 | OpenAI Whisper for transcription | Best accuracy vs. cost, proven at scale | Kenneth |
| 2025-11-12 | Supabase for backend | Free tier, built-in auth, edge functions for AI calls | Kenneth |
| 2025-11-12 | Salesforce integration first | Largest market share in enterprise sales | Kenneth |
| 2025-11-12 | 5-minute max recording | Balance API costs vs. typical meeting length | Kenneth |
| 2025-11-15 | OAuth PKCE pattern: Store verifier in state | localStorage unreliable during redirects | Kenneth + Claude |
| 2025-11-15 | Code verifier charset: No `~` character | URLSearchParams encodes `~` to `%7E`, causes OAuth errors | Kenneth + Claude |
| [Add yours] | | | |

---

## 📚 IMPORTANT DOCUMENTATION

### OAuth Integration Guide
**MUST READ before implementing HubSpot or Pipedrive OAuth:**

See `docs/oauth-integration-guide.md` for complete OAuth integration patterns and critical lessons learned from Salesforce integration.

**Key takeaways:**
- ✅ Store code_verifier in **state parameter** (not localStorage)
- ✅ Use charset **without `~`** character
- ✅ Use **plain env var names** in Edge Functions (no VITE_ prefix)
- ✅ Use **service role key** for Edge Function authentication
- ✅ **Verify everything** - add comprehensive logging during development

---

**Last Updated**: November 12, 2025  
**Version**: 1.0  
**MVP Target**: 4-6 weeks
