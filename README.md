# Happy Learn - AI-Powered CBC Study Buddy 🎓

**Designed with and for Kenyan Learners**  
Supporting UN SDG 4: Quality Education through inclusive, AI-enhanced learning tools.

## 🌟 Overview

Happy Learn is an intelligent study companion tailored to the Kenyan Competency-Based Curriculum (CBC). The app provides personalized, interactive learning experiences for students in Grades 1-9, with special focus on accessibility through voice interaction and mobile-first design.

### Key Features

✅ **Voice-First Learning**
- Natural speech recognition optimized for Kenyan English dialects
- Text-to-speech responses with local accent support
- Seamless toggle between text and voice modes
- Voice input processed locally on device (privacy-first)

✅ **CBC-Aligned Curriculum**
- Structured content for Grades 1-9
- Subject-specific guidance (Mathematics, Science, English, Kiswahili, etc.)
- Competency-based learning approach
- Real-world Kenyan context examples

✅ **Smart Progress Tracking**
- Automatic lesson and question counting
- Learning streak monitoring
- Competency development metrics
- Personalized dashboard

✅ **Privacy & Data Protection**
- Fully compliant with Kenya Data Protection Act (2019)
- Explicit consent flows with clear explanations
- End-to-end encryption for all data
- User-controlled data management
- Voice processing happens locally (no cloud recording)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern browser with Web Speech API support (Chrome, Edge, Safari recommended)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/happy-learn.git
cd happy-learn

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables

```env
# Supabase Configuration (Lovable Cloud)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_PROJECT_ID=your_project_id

# AI Configuration (Server-side only)
LOVABLE_API_KEY=auto_configured_by_lovable_cloud
```

**Important:** `LOVABLE_API_KEY` is automatically configured when using Lovable Cloud. Never expose API keys in client-side code.

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS with custom design tokens
- **State Management:** React Context API
- **Voice Features:** Web Speech API (native browser support)
- **UI Components:** shadcn/ui component library

### Backend (Supabase Edge Functions)
- **Runtime:** Deno on Supabase Edge
- **AI Provider:** Lovable AI Gateway (Google Gemini 2.5 Flash)
- **Database:** PostgreSQL with Row-Level Security
- **Authentication:** Supabase Auth with JWT
- **Rate Limiting:** 50 requests/minute per user

### Key Technical Decisions

1. **Voice Processing:** Uses browser-native Web Speech API to process voice locally - no audio data sent to servers, ensuring privacy and low latency.

2. **AI Backend:** Lovable AI Gateway abstracts model selection and provides cost-effective, scalable AI responses optimized for education.

3. **Mobile-First:** Optimized for Android devices common in Kenyan schools, with offline-capable PWA features.

4. **Modular Code:** Edge functions are serverless and auto-deployed, ensuring zero-downtime updates.

## 📚 Usage Guide

### For Students

1. **Sign Up / Login**
   - Use your email to create an account
   - Accept privacy consent (required)
   - Set your grade level and subjects

2. **Text Mode**
   - Type questions in the chat box
   - Press Enter to send, Shift+Enter for new line
   - Receive CBC-aligned explanations with examples

3. **Voice Mode** 🎤
   - Tap the microphone icon to enable voice
   - Speak your question naturally
   - Happy will respond with both text and voice
   - Great for learners with limited typing skills

4. **Track Progress**
   - View your dashboard for study metrics
   - Monitor learning streaks
   - See competency development across subjects

### For Educators

Happy Learn can supplement classroom teaching:
- Assign students to explore specific topics
- Review progress dashboards to identify learning gaps
- Use voice mode to support inclusive learning environments

## 🔐 Privacy & Compliance

### Kenya Data Protection Act (2019) Compliance

Happy Learn implements the following safeguards:

✅ **Transparent Consent**
- Clear, readable privacy policy
- Explicit opt-in for data collection
- Separate consent for voice, analytics, and progress tracking

✅ **Data Minimization**
- Only essential data is collected
- Voice audio is processed locally and never stored
- User identifiers are anonymized in analytics

✅ **User Rights**
- View all collected data from dashboard
- Export data in machine-readable format
- Delete account and all associated data
- Withdraw consent at any time

✅ **Security Measures**
- End-to-end encryption for data transmission
- Token-based authentication (JWT)
- Regular security audits
- Automatic session timeout

### Data We Collect

| Data Type | Purpose | Retention | User Control |
|-----------|---------|-----------|--------------|
| Email & Name | Account management | Until account deletion | Full |
| Learning Progress | Personalization | Until account deletion | Full |
| Voice Transcripts | Local processing only | Not stored | N/A |
| Usage Analytics | App improvement | 90 days (anonymized) | Optional |

## 🧪 Testing

### Manual Test Checklist

Run these tests after deployment:

```bash
# Start dev server
npm run dev
```

- [ ] **Voice Input Test:** Enable voice mode, ask "What is energy?" → Should transcribe correctly
- [ ] **Grade Context Test:** Set Grade 6, ask about fractions → Should provide age-appropriate answer
- [ ] **Privacy Flow:** Clear browser data, reload → Consent dialog should appear
- [ ] **Offline Resilience:** Disable network, try sending message → Should show clear error
- [ ] **Mobile Responsive:** Open on phone, test all buttons and voice → Should work smoothly
- [ ] **Rate Limiting:** Send 51 requests rapidly → Should block with clear message

### Automated Tests

```bash
# Run unit tests
npm test

# Build for production
npm run build

# Check bundle for leaked secrets
npm run check-bundle
```

## 📊 Performance & Costs

### Target Metrics
- ⏱️ **Voice Response Latency:** < 2 seconds
- 📱 **Mobile Performance:** > 90 Lighthouse score
- 💰 **AI Cost per User:** < $0.02/day for active users
- 📈 **Uptime:** 99.5% availability

### Rate Limits
- **Chat API:** 50 requests per minute per user
- **Voice Input:** Unlimited (local processing)
- **Dashboard:** 10 requests per minute

## 🛠️ Development

### Project Structure

```
happy-learn/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ConsentDialog.tsx
│   │   ├── GradeSelector.tsx
│   │   └── ...
│   ├── contexts/         # Global state management
│   │   ├── AuthContext.tsx
│   │   └── ProgressContext.tsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useVoiceInput.tsx
│   │   └── useVoiceOutput.tsx
│   ├── pages/            # Route components
│   │   ├── Chat.tsx
│   │   ├── Dashboard.tsx
│   │   └── ...
│   └── data/             # CBC curriculum structure
│       └── cbcStructure.ts
├── supabase/
│   ├── functions/        # Edge functions (AI, auth)
│   │   └── chat/
│   │       └── index.ts
│   └── migrations/       # Database schema
└── public/               # Static assets
```

### Adding New Features

1. **Voice Commands:** Extend `useVoiceInput` hook with keyword detection
2. **New Subjects:** Update `cbcStructure.ts` with curriculum details
3. **Custom Edge Functions:** Add to `supabase/functions/`

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## 🚢 Deployment

### Lovable Cloud (Recommended)

Automatic deployment via Lovable Cloud:
1. Push changes to main branch
2. Edge functions auto-deploy
3. Frontend builds and deploys
4. Database migrations run automatically

### Manual Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel/Netlify
npm run deploy
```

## 📝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Follow existing code style
4. Add tests for new features
5. Submit a pull request with clear description

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Support

- **Email:** support@happylearn.ke (example)
- **Privacy Officer:** privacy@happylearn.ke
- **Community:** Join our Discord/Slack for educator discussions

## 🎯 Roadmap

- [ ] Offline mode with local AI (TinyLLM)
- [ ] Kiswahili language support
- [ ] Parent/teacher dashboard
- [ ] Gamification and rewards
- [ ] Multi-student classroom mode
- [ ] SMS-based fallback for low connectivity

---

**Built with ❤️ for Kenyan Learners**  
Supporting SDG 4: Quality Education for All
