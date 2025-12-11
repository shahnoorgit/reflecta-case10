# Reflecta Chat 💬✨

A production-ready ChatGPT mobile app clone built with React Native, Expo, OpenRouter, ElevenLabs, and Supabase. Features AI chat, voice mode, image generation, document analysis, and cloud sync.

![React Native](https://img.shields.io/badge/React_Native-0.81-blue)
![Expo](https://img.shields.io/badge/Expo-54-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Supabase](https://img.shields.io/badge/Supabase-Enabled-green)

## ✨ Features

### 🤖 AI Chat
- **Multiple AI Models** - GPT-4o, GPT-4o Mini, Claude 3.5 Sonnet, Gemini Pro 1.5, Llama 3.1 70B
- **Real-time Streaming** - Token-by-token streaming responses for instant feedback
- **Conversation History** - Persistent chat history with automatic cloud sync
- **Smart Titles** - AI-generated conversation titles
- **Multi-turn Conversations** - Full context awareness across messages

### 🎙️ Voice Mode
- **Voice Input** - Press and hold to record, release to send
- **Whisper Transcription** - OpenAI Whisper for accurate speech-to-text
- **Text-to-Speech** - ElevenLabs voices for natural AI responses
- **Multiple Voices** - Choose from Sarah, Rachel, Domi, Antoni, Elli, Josh
- **Beautiful UI** - Full-screen voice mode with animated visualizations
- **Voice Messages Saved** - Transcribed voice messages saved to chat history

### 🎨 Image Generation
- **AI Image Creation** - Generate images from text prompts
- **Pollinations AI** - Free image generation (no API key required)
- **DALL-E Support** - Optional OpenAI DALL-E integration
- **Smart Detection** - Automatically detects image generation requests
- **Cloud Storage** - Generated images saved to Supabase Storage
- **Skeleton Loaders** - Beautiful loading states while generating

### 📄 Document Analysis
- **Multimodal AI** - Claude 3.5 Sonnet and GPT-4o analyze document content
- **Base64 Encoding** - Documents sent securely to AI models
- **File Attachments** - Support for images and documents in messages

### ☁️ Cloud Sync
- **Supabase Integration** - Automatic cloud sync for conversations
- **Multi-device Support** - Access your chats from any device
- **User Isolation** - Each user sees only their own conversations
- **Offline Support** - Works offline, syncs when online
- **Attachment Storage** - Images and files stored in Supabase Storage

### 🔐 Authentication
- **Supabase Auth** - Secure email/password authentication
- **Session Management** - Automatic session handling
- **User Profiles** - User-specific data isolation
- **Secure Storage** - API keys stored securely

### 💅 Polished UX
- **ChatGPT-inspired Design** - Beautiful dark mode UI
- **Smooth Animations** - Spring animations, fades, and slides
- **Haptic Feedback** - Tactile feedback on interactions
- **Responsive Input** - Auto-expanding multi-line text input
- **Image Attachments** - Camera and gallery support
- **Loading States** - Skeleton loaders and progress indicators

### ⚙️ Customizable
- **Temperature Control** - Adjust AI response creativity (0-2)
- **Max Tokens** - Set response length limits
- **Voice Selection** - Choose your preferred AI voice
- **Model Selection** - Switch between different AI models
- **Feature Toggles** - Enable/disable haptics and voice mode

## 🏗️ Scalable Architecture

### Feature-Based Structure

The project uses a **feature-based architecture** that scales beautifully:

```
reflecta-chat/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx              # Root layout with theme
│   ├── +html.tsx                # HTML document config
│   └── index.tsx                # Main entry point
│
├── src/
│   ├── features/                # Feature modules (scalable)
│   │   ├── auth/                # Authentication feature
│   │   │   ├── screens/         # Auth screens
│   │   │   │   ├── AuthNavigator.tsx
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   └── SignupScreen.tsx
│   │   │   ├── store/           # Auth state management
│   │   │   │   └── authStore.ts
│   │   │   └── index.ts         # Feature exports
│   │   │
│   │   └── chat/                # Chat feature (main)
│   │       ├── api/             # API clients
│   │       │   ├── openRouterClient.ts    # OpenRouter API
│   │       │   ├── elevenLabsClient.ts    # ElevenLabs TTS
│   │       │   └── whisperClient.ts       # Whisper STT
│   │       ├── components/       # Reusable UI components
│   │       │   ├── ChatHeader.tsx
│   │       │   ├── ChatInput.tsx
│   │       │   ├── MessageBubble.tsx
│   │       │   ├── ConversationSidebar.tsx
│   │       │   ├── EmptyChat.tsx
│   │       │   └── VoiceMode.tsx
│   │       ├── screens/         # Full screens
│   │       │   ├── ChatScreen.tsx
│   │       │   └── SettingsScreen.tsx
│   │       ├── store/           # Zustand store
│   │       │   └── chatStore.ts
│   │       ├── types.ts         # TypeScript types
│   │       └── index.ts         # Feature exports
│   │
│   ├── services/                # Shared services
│   │   ├── attachmentService.ts      # File/image uploads
│   │   ├── chatSyncService.ts        # Cloud sync logic
│   │   └── imageGenerationService.ts # Image generation
│   │
│   ├── lib/                      # Third-party integrations
│   │   └── supabase.ts          # Supabase client
│   │
│   └── config/                   # Configuration
│       └── env.ts               # Environment variables
│
├── assets/                      # Static assets
│   ├── fonts/
│   └── images/
│
└── docs/                        # Documentation
    └── changes/                 # Change logs
```

### Architecture Benefits

✅ **Scalable** - Easy to add new features without touching existing code  
✅ **Maintainable** - Each feature is self-contained  
✅ **Testable** - Features can be tested in isolation  
✅ **Reusable** - Components and services can be shared  
✅ **Type-safe** - Full TypeScript support throughout  

### Adding a New Feature

1. Create a new folder in `src/features/`
2. Add `api/`, `components/`, `screens/`, `store/` as needed
3. Export from `index.ts`
4. Import and use in `app/` routes

Example:
```typescript
// src/features/new-feature/index.ts
export { NewFeatureScreen } from './screens/NewFeatureScreen';
export { useNewFeatureStore } from './store/newFeatureStore';
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS Simulator** or **Android Emulator** (or Expo Go app)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/reflecta-chat.git
cd reflecta-chat

# Install dependencies
npm install

# Start the development server
npm start
```

### Environment Setup

#### Option 1: Using pushenv (Recommended) 🔒

[pushenv](https://github.com/shahnoorgit/pushenv) is an open-source tool (maintained by the author of this project) that lets you securely share and manage environment variables with encrypted storage. Perfect for team collaboration!

```bash
# Install pushenv globally
npm i -g pushenv

# Pull encrypted environment variables (creates .env file automatically)
pushenv pull

# When prompted, enter the passphrase: reflecta
```

This will automatically create a `.env` file with all required environment variables. The tool uses encryption to safely store and share sensitive configuration data.

**Note**: pushenv is an open-source project created and maintained by the maintainer of Reflecta Chat for secure environment variable management across teams.

#### Option 2: Manual Setup

If you prefer to set up environment variables manually:

1. **Create `.env` file** in the project root:
```env
# Required
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_key

# Optional (can also be set in Settings UI)
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_key
EXPO_PUBLIC_DEEPSEEK_API_KEY=your_deepseek_key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key

```

2. **Configure Supabase** (required for cloud sync):
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Set up tables: `conversations`, `messages`, `attachments`
   - Create storage bucket: `chat-attachments`
   - Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `.env`

### API Keys Setup

#### Required

1. **OpenRouter API Key** (Required for chat to work)
   - Go to [OpenRouter](https://openrouter.ai/keys)
   - Create an account and generate an API key
   - Add credits to your account
   - Add to `.env` as `EXPO_PUBLIC_OPENROUTER_API_KEY` OR set in Settings → API Keys
   - **Note**: Must be set in either `.env` or Settings for chat to function

2. **Supabase** (Required for cloud sync and authentication)
   - Create project at [supabase.com](https://supabase.com)
   - Get URL and anon key
   - Add to `.env` as `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`

#### Optional

3. **ElevenLabs API Key** (For text-to-speech in voice mode)
   - Go to [ElevenLabs](https://elevenlabs.io)
   - Create an account and navigate to API settings
   - Copy your API key
   - Add to `.env` as `EXPO_PUBLIC_ELEVENLABS_API_KEY` OR set in Settings → API Keys
   - Used for voice responses

4. **DeepSeek API Key** (For conversation summarization)
   - Go to [DeepSeek](https://platform.deepseek.com)
   - Create an account and generate an API key
   - Add to `.env` as `EXPO_PUBLIC_DEEPSEEK_API_KEY` OR set in Settings → API Keys
   - Used for rolling context window summaries

5. **OpenAI API Key** (For DALL-E image generation fallback)
   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create an API key
   - Add to `.env` as `EXPO_PUBLIC_OPENAI_API_KEY` (NOT available in Settings UI)
   - Used as fallback when Pollinations AI fails (Pollinations is free and works without this key)
   - **Note**: Image generation works without this key using free Pollinations AI

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | React Native + Expo | Cross-platform mobile development |
| **Language** | TypeScript | Type safety and better DX |
| **Navigation** | Expo Router | File-based routing |
| **State Management** | Zustand | Lightweight state management |
| **Persistence** | AsyncStorage | Local storage |
| **AI API** | OpenRouter | Unified access to multiple AI models |
| **Voice STT** | OpenAI Whisper | Speech-to-text transcription |
| **Voice TTS** | ElevenLabs | Text-to-speech synthesis |
| **Image Generation** | Pollinations AI / DALL-E | AI image generation |
| **Backend** | Supabase | Database, auth, and storage |
| **Animations** | React Native Reanimated | Smooth animations |
| **UI** | Custom components | ChatGPT-inspired design |

## 📱 Usage

### Starting a Chat

1. Open the app
2. Configure API keys in Settings (if not done)
3. Type a message or use voice mode
4. Get instant AI responses with streaming

### Voice Mode

1. Tap the microphone button in chat input
2. Hold to record your message
3. Release to send and get AI response
4. Response is spoken automatically (if ElevenLabs key is set)

### Image Generation

Simply ask for an image:
- "Generate an image of a sunset"
- "Create a picture of a robot"
- "Show me what a uniform looks like"

The app automatically detects image requests and generates them.

### Document Analysis

1. Tap the + button in chat input
2. Select "Gallery" or "Camera"
3. Attach an image or PDF
4. Ask questions about the document

### Cloud Sync

- Conversations automatically sync to Supabase
- Works across devices when logged in
- Offline support - syncs when online
- User-specific data isolation

## 🔧 Key Implementation Details

### Streaming Responses

Real-time token streaming using XMLHttpRequest (works reliably in React Native):

```typescript
streamChatCompletionWithCallback(
  messages,
  model,
  temperature,
  maxTokens,
  onChunk,  // Called for each token
  onDone,   // Called when complete
  onError   // Called on error
)
```

### Voice Messages

Voice messages are transcribed and saved to chat:

```typescript
// 1. Record audio
const { recording } = await Audio.Recording.createAsync(...)

// 2. Transcribe with Whisper
const text = await transcribeWithWhisper(audioUri)

// 3. Save to chat (same as text messages)
await sendMessage(text)
```

### Image Generation

Smart detection and generation:

```typescript
// Detects patterns like "generate image", "create picture", etc.
if (isImageGenerationRequest(message)) {
  const prompt = extractImagePrompt(message)
  const image = await generateImage(prompt)
  // Uploads to cloud storage automatically
}
```

### Cloud Sync

Automatic bidirectional sync:

```typescript
// Fetch user's conversations from cloud
const cloudConversations = await fetchConversationsFromCloud(userId)

// Merge with local (newer wins)
const merged = mergeConversations(local, cloud, userId)

// Sync local changes to cloud
await syncConversationToCloud(conversation, userId)
```

### State Management

Zustand with persistence:

```typescript
const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({ /* state and actions */ }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

## 📊 Database Schema

### Supabase Tables

**conversations**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `title` (text)
- `model` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**messages**
- `id` (uuid, primary key)
- `conversation_id` (uuid, foreign key)
- `role` (text: 'user' | 'assistant' | 'system')
- `content` (text)
- `created_at` (timestamp)

**attachments**
- `id` (uuid, primary key)
- `message_id` (uuid, foreign key)
- `user_id` (uuid, foreign key)
- `type` (text: 'image' | 'file')
- `name` (text)
- `mime_type` (text)
- `size` (integer)
- `storage_path` (text)
- `url` (text)

**Storage Bucket**
- `chat-attachments` - Stores images and files
- Path: `{userId}/{messageId}/{attachmentId}.{ext}`

## 🧪 Development

### Running the App

```bash
# Start Expo dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

### Project Scripts

- `npm start` - Start Expo dev server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com) for ChatGPT inspiration and Whisper
- [OpenRouter](https://openrouter.ai) for unified AI API access
- [ElevenLabs](https://elevenlabs.io) for voice synthesis
- [Supabase](https://supabase.com) for backend infrastructure
- [Expo](https://expo.dev) for the amazing React Native platform
- [Pollinations](https://pollinations.ai) for free image generation
- [pushenv](https://github.com/shahnoorgit/pushenv) - Open-source tool for secure environment variable management (created and maintained by the maintainer of this project)

---

Built with ❤️ using React Native and Expo
