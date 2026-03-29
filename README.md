# Memory Palace

This project is a therapeutic platform that helps patients engage with and recall their memories through AI-powered conversations and immersive 3D environments. Memory Palace is designed to support cognitive therapy, memory rehabilitation, and engagement for patients with memory impairments, particularly those with dementia.

## Overview

Memory Palace combines several technologies to create an integrated therapeutic experience:

- **Memory Management**: Caregivers store and organize patient memories with images and descriptions
- **3D Immersive Worlds**: Generate photorealistic 3D environments from memories; patients enter a calm “memory lobby” and step into individual memories through different doors
- **AI Conversations**: Guided discussions with an intelligent conversational agent that understands context and patient history, providing reminiscence prompts as patients walk around the 3D world
- **Session Tracking**: Caregivers monitor therapy sessions with engagement metrics and conversation logs
- **Progress Analytics**: Clinicans xisualize patient engagement trends and therapy progress over time

## Demo

[![Demo Video](https://img.youtube.com/vi/Fl4BcRY_x_4/0.jpg)](https://www.youtube.com/watch?v=Fl4BcRY_x_4)


## Key Features

### 💾 Memory Management
- Upload and store patient memories with images
- Tag and organize memories by themes
- View memory details and associated therapy sessions
- Track which memories have generated 3D worlds

### 🌍 3D World Generation
- Generate immersive 3D environments from:
  - Text descriptions of memories
  - Memory images
  - External image URLs
- Uses World Labs API (Marble model) for high-quality environments
- View worlds in an interactive 3D viewer

### 🗣️ AI Conversational Agent
- Multi-turn conversations with context awareness
- Automatic memory annotation based on therapy discussions
- Speech recognition (OpenAI Whisper)
- Text-to-speech synthesis for accessibility
- Support for different AI models and customizable parameters

### 📊 Progress Tracking
- Dashboard with session statistics
- Engagement trends visualization
- Session duration tracking
- Notes and annotations per session

### 👥 Session Management
- Create therapy sessions linked to specific memories
- Log conversation messages during sessions
- Record engagement scores
- View complete conversation history

## Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Styling
- **Three.js & React Three Fiber** - 3D graphics
- **Gaussian Splats** - 3D scene visualization
- **Recharts** - Analytics visualizations

### Backend
- **Next.js API Routes** - RESTful API endpoints
- **Supabase** - PostgreSQL database and authentication
- **OpenAI API** - Conversational AI and voice features

### External APIs
- **World Labs API (Marble)** - 3D world generation
- **OpenAI GPT** - Conversation and language models
- **OpenAI Whisper** - Speech-to-text transcription
- **OpenAI TTS** - Text-to-speech synthesis

## Project Structure

```
memory-palace/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API endpoints
│   │   │   ├── conversations/    # AI conversation API
│   │   │   ├── memories/         # Memory CRUD operations
│   │   │   ├── sessions/         # Session management
│   │   │   ├── world/            # 3D world generation
│   │   │   ├── progress/         # Analytics
│   │   │   └── patient/          # Patient data
│   │   ├── (dashboard)/          # Dashboard layout group
│   │   │   ├── dashboard/        # Main dashboard
│   │   │   ├── lobby/            # Memory lobby
│   │   │   └── progress/         # Analytics page
│   │   ├── viewer/               # 3D world viewer
│   │   ├── onboarding/           # Initial setup
│   │   └── layout.tsx            # Root layout
│   ├── components/               # React components
│   │   ├── dashboard/            # Dashboard components
│   │   ├── lobby/                # Memory lobby components
│   │   ├── progress/             # Analytics components
│   │   ├── viewer/               # 3D viewer components
│   │   └── ui/                   # Reusable UI components
│   ├── hooks/                    # Custom React hooks
│   │   ├── useConversation.ts
│   │   ├── useSpeechRecognition.ts
│   │   ├── useRealtimeConversation.ts
│   │   ├── useAudioPlayback.ts
│   │   └── ...
│   ├── lib/                      # Utility libraries
│   │   ├── conversation-agent.ts # AI conversation service
│   │   ├── db.ts                 # Database operations
│   │   ├── world-api.ts          # World Labs API client
│   │   └── utils.ts              # Helper utilities
│   └── types/                    # TypeScript type definitions
│       ├── index.ts
│       ├── speech.d.ts
│       └── gaussian-splats-3d.d.ts
├── supabase/
│   └── migrations/               # Database migrations
├── public/                       # Static assets
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── eslint.config.mjs
```

## Getting Started

### Prerequisites

- **Node.js 18+** and npm/yarn/pnpm
- **Supabase account** with a PostgreSQL database
- **OpenAI API key** for GPT, Whisper, and TTS features
- **World Labs API key** for 3D world generation (optional but recommended)

### Installation

1. **Clone and navigate to the project**
   ```bash
   cd memory-palace
   npm install
   ```

2. **Set up environment variables**
   
   Create a `.env.local` file in the `memory-palace` directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # OpenAI Configuration
   OPENAI_API_KEY=sk_your_openai_api_key
   
   # World Labs Configuration (Optional)
   WLT_API_KEY=your_world_labs_api_key
   ```

3. **Set up the database**
   
   The Supabase migrations are included in `supabase/migrations/`. Apply them to your Supabase database:
   - Run migrations through Supabase dashboard or CLI
   - Migrations create tables for: memories, sessions, conversations, cognitive profiles

4. **Start the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Documentation

Memory Palace exposes a comprehensive REST API for all operations.

### Core API Routes

#### **Memories** - Manage patient memories
```
GET    /api/memories              # List all memories
POST   /api/memories              # Create new memory
GET    /api/memories/:id          # Get memory details
PUT    /api/memories/:id          # Update memory
DELETE /api/memories/:id          # Delete memory
```

#### **Sessions** - Manage therapy sessions
```
GET    /api/sessions              # List all sessions
POST   /api/sessions              # Create new session
GET    /api/sessions/:id          # Get session details
POST   /api/sessions/:id          # Session actions (add messages, end, update engagement)
```

#### **Conversations** - AI-powered conversations
```
POST   /api/conversations         # Start new conversation
GET    /api/conversations/:id     # Get conversation details
POST   /api/conversations/:id/messages          # Send message
POST   /api/conversations/:id/transcribe        # Transcribe audio
POST   /api/conversations/:id/synthesize        # Generate speech
```

#### **World Generation** - Create 3D environments
```
POST   /api/world/generate        # Start 3D world generation
GET    /api/world/status/:id      # Check generation status
```

#### **Analytics** - Patient progress and engagement
```
GET    /api/patient               # Get patient information
GET    /api/progress              # Get progress statistics
```

For complete API documentation with request/response examples, see [API_ROUTES.md](memory-palace/API_ROUTES.md).

## Usage Examples

### Create and Use a Memory

```bash
# 1. Create a memory
curl -X POST http://localhost:3000/api/memories \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Summer Vacation 1985",
    "description": "Family trip to the beach house",
    "imageUrl": "https://example.com/beach.jpg",
    "tags": "family,vacation,beach"
  }'

# 2. Generate a 3D world from the memory
curl -X POST http://localhost:3000/api/world/generate \
  -H "Content-Type: application/json" \
  -d '{
    "memoryId": "mem-123",
    "textPrompt": "A beautiful beach house from the 1980s with sandy shores"
  }'

# 3. Create a therapy session
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "memoryId": "mem-123",
    "worldId": 1
  }'

# 4. Start a conversation about the memory
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Discussing Summer 1985",
    "systemPrompt": "You are a compassionate therapist helping the patient recall their beach vacation.",
    "sessionId": "session-123",
    "model": "gpt-4o-mini"
  }'
```

### Add Messages to Conversation

```bash
curl -X POST http://localhost:3000/api/conversations/conv-123/messages \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user",
    "message": "Tell me about the beach house - what did it look like?"
  }'
```

## Key Features in Detail

### Conversational AI Agent

The AI agent (`src/lib/conversation-agent.ts`) provides:
- Context-aware conversations linked to specific memories
- Automatic session annotation from conversation insights
- Support for GPT-4o, GPT-4o-mini, and other OpenAI models
- Customizable temperature and token limits
- Conversation history management

See [CONVERSATION_AI_GUIDE.md](memory-palace/CONVERSATION_AI_GUIDE.md) for detailed configuration.

### 3D World Generation

Memory Palace integrates with World Labs API to generate immersive 3D environments:
- Generate worlds from text descriptions
- Generate worlds from memory images
- Support for different quality levels (Draft/Standard)
- Real-time status polling for async operations
- Interactive 3D viewer with camera controls

### Real-time Features

The platform includes real-time capabilities through WebSocket connections:
- Live speech recognition and transcription
- Streaming conversation responses
- Real-time engagement updates

## Development

### Available Scripts

```bash
npm run dev        # Start development server (http://localhost:3000)
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
```

### Adding New Features

When adding new features:

1. **API Routes**: Create new files in `src/app/api/**/route.ts`
2. **Database**: Run migrations in `supabase/migrations/` and update `src/lib/db.ts`
3. **Components**: Create React components in `src/components/`
4. **Hooks**: Add custom hooks in `src/hooks/`
5. **Types**: Define types in `src/types/index.ts`

### Testing

To test API endpoints, use the provided curl examples in [API_ROUTES.md](memory-palace/API_ROUTES.md) or Python test script at [test-world-api.py](test-world-api.py).

## Configuration

### Environment Variables

Create `.env.local` in `memory-palace/`:

```env
# Required: Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Required: OpenAI
OPENAI_API_KEY=sk_...

# Optional: World Labs (for 3D generation)
WLT_API_KEY=wlt_...

# Optional: Deployment
NEXT_PUBLIC_APP_URL=https://memory-palace.example.com
```

### Supabase Setup

1. Create a Supabase project
2. Apply migrations from `supabase/migrations/`
3. Optional: Configure Row Level Security (RLS) for multi-tenant support

### OpenAI Configuration

- Set your OpenAI API key
- Default model: `gpt-4o-mini` (lower cost, good for therapy)
- Customize in conversation payload: `"model": "gpt-4o"` for higher performance

## Architecture Decisions

### Next.js App Router
- Modern async components for efficient data fetching
- File-based routing with dynamic segments
- Layout composition for shared UI

### Supabase + PostgreSQL
- Real-time capabilities via RealtimeClient
- Built-in authentication (can be extended)
- Full SQL support with migrations

### OpenAI API Integration
- Uses latest models with streaming support
- Whisper for accurate speech transcription
- TTS for accessibility
- Multi-turn conversation management

### World Labs for 3D Generation
- High-quality photorealistic environment generation
- Efficient credit usage with Draft/Standard tiers
- Asynchronous generation with polling

## Documentation

- [API_ROUTES.md](memory-palace/API_ROUTES.md) - Complete API endpoint documentation
- [CONVERSATION_AI_GUIDE.md](memory-palace/CONVERSATION_AI_GUIDE.md) - Detailed AI agent configuration
- [IMPLEMENTATION_SUMMARY.md](memory-palace/IMPLEMENTATION_SUMMARY.md) - Architecture overview
- [QUICK_REFERENCE.md](memory-palace/QUICK_REFERENCE.md) - Quick API reference

## Troubleshooting

### Database Connection Issues
- Verify Supabase URL and anon key in `.env.local`
- Check that migrations have been applied
- Ensure Supabase project is active

### OpenAI API Errors
- Verify API key is correct (should start with `sk_`)
- Check account has available credits
- Review OpenAI console for usage and errors

### World Labs Generation Fails
- Confirm WLT_API_KEY is set correctly
- Check World Labs dashboard for remaining credits
- Verify image format and size if using image input

### 3D Viewer Not Loading
- Check browser console for WebGL errors
- Verify Three.js and texture files load correctly
- Try different browser or graphics API (WebGL 2)

## Future Enhancements

- [ ] Multi-patient support with role-based access
- [ ] Advanced cognitive assessment tools
- [ ] Mobile app for remote therapy
- [ ] Integration with EHR systems
- [ ] Caregiver dashboard
- [ ] Offline memory access
- [ ] Advanced analytics and reporting
- [ ] Integration with wearable devices

## Performance Considerations

- Server-side rendering for initial page load
- Lazy loading of 3D assets
- Stream responses from OpenAI for faster perceived performance
- Image optimization through Next.js Image component
- Database indexing on frequently queried fields

## Contributing

When contributing to this project:
1. Create descriptive commit messages
2. Update relevant documentation
3. Test API changes with provided curl examples
4. Follow TypeScript best practices
5. Ensure ESLint passes

## License

[Add your license here]

## Support

For issues, questions, or feature requests:
- Check existing documentation in `memory-palace/`
- Review API examples in [API_ROUTES.md](memory-palace/API_ROUTES.md)
- Test with curl commands provided in documentation

---

**Last Updated**: March 2026

This is a specialized therapeutic application designed to support memory rehabilitation and engagement. Always ensure patient privacy and data security when deploying in clinical settings.
