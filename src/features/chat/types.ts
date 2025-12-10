/**
 * Chat Feature Types
 * Type definitions for the ChatGPT clone
 */

export interface Attachment {
  id: string;
  type: 'image' | 'file';
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
  base64?: string; // For sending to AI
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  summary?: string; // AI-generated summary of older messages
  summaryUpToIndex?: number; // Index up to which messages are summarized
  createdAt: number;
  updatedAt: number;
  model: string;
  userId?: string; // User ID for multi-user support
  syncedAt?: number; // Timestamp of last successful sync
  syncStatus?: 'synced' | 'pending' | 'error'; // Sync status
}

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  contextLength: number;
}

export interface ChatSettings {
  openRouterApiKey: string;
  openAiApiKey: string; // For Whisper speech-to-text
  elevenLabsApiKey: string;
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  voiceEnabled: boolean;
  selectedVoice: string;
  hapticFeedback: boolean;
}

export interface VoiceState {
  isRecording: boolean;
  isPlaying: boolean;
  isSpeaking: boolean;
  audioLevel: number;
}

// OpenRouter API Types
export interface OpenRouterMessageContent {
  type: 'text' | 'image_url' | 'file';
  text?: string;
  image_url?: {
    url: string; // Can be URL or base64 data URI
  };
  file?: {
    filename: string;
    file_data: string; // base64 data URI
  };
}

export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | OpenRouterMessageContent[];
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ElevenLabs API Types
export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
}

export interface ElevenLabsTTSRequest {
  text: string;
  model_id: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

// Available models for the app
export const AVAILABLE_MODELS: ChatModel[] = [
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable model, great for complex tasks',
    provider: 'OpenAI',
    contextLength: 128000,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and affordable for everyday tasks',
    provider: 'OpenAI',
    contextLength: 128000,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Excellent for nuanced conversations',
    provider: 'Anthropic',
    contextLength: 200000,
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    description: 'Google\'s advanced multimodal model',
    provider: 'Google',
    contextLength: 1000000,
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    description: 'Open source powerhouse',
    provider: 'Meta',
    contextLength: 131072,
  },
];

// Default ElevenLabs voices
export const DEFAULT_VOICES = [
  { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', category: 'conversational' },
  { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'conversational' },
  { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', category: 'conversational' },
  { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', category: 'conversational' },
  { voice_id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', category: 'conversational' },
  { voice_id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', category: 'conversational' },
];

