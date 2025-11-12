# Field Intel - Voice-to-CRM for Field Sales

Transform voice notes into structured CRM data automatically. Built for field sales reps who waste hours on manual data entry.

## 🎯 Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- OpenAI API key
- CRM account (Salesforce/HubSpot/Pipedrive)

### Installation

1. **Clone or navigate to project:**
```bash
cd Field-Intel-Voice-CRM
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
# Edit .env.local with your real credentials
```

4. **Start development server:**
```bash
npm run dev
```

5. **Open browser:**
```
http://localhost:5173
```

## 📚 Documentation

- **[IDEA.md](./IDEA.md)** - Full business case, market analysis, technical architecture
- **[claude.md](./claude.md)** - Development rules and coding standards
- **[SETUP_PROMPT.md](./SETUP_PROMPT.md)** - Claude Code quick start guide

## 🏗️ Tech Stack

- **Frontend:** Vite + React (PWA)
- **Backend:** Supabase (Auth, Database, Storage, Edge Functions)
- **AI:** OpenAI Whisper (transcription) + GPT-4 (analysis)
- **CRM:** Salesforce, HubSpot, Pipedrive integrations
- **Deployment:** Vercel

## 🚀 Development

### With Claude Code

1. Open terminal in project root
2. Run: `claude`
3. Start with: `/init` or read `SETUP_PROMPT.md`

### Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run lint         # Lint code
```

## 📁 Project Structure

```
src/
├── components/      # React components
│   ├── voice/      # Recording UI
│   ├── analysis/   # AI results display
│   └── crm/        # CRM integration
├── services/        # API integrations
├── hooks/           # Custom React hooks
└── styles/          # Typography & colors
```

## 🎯 MVP Goals

- [x] Project setup with Claude Code structure
- [ ] Voice recording (Web Audio API)
- [ ] Whisper transcription integration
- [ ] GPT-4 data extraction
- [ ] Salesforce sync
- [ ] Manager dashboard
- [ ] Deploy to Vercel

**Target:** 4-6 weeks to MVP

## 📝 License

Proprietary - Kenneth Okalang © 2025
