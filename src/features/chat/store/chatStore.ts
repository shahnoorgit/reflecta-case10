/**
 * Chat Store
 * Zustand store for managing chat state, conversations, and settings
 * Includes Supabase sync with offline support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { apiKeys } from '../../../config/env';
import { uploadAttachments, uploadGeneratedImage } from '../../../services/attachmentService';
import {
  deleteConversationFromCloud,
  fetchConversationsFromCloud,
  mergeConversations,
  syncConversationToCloud
} from '../../../services/chatSyncService';
import {
  extractImagePrompt,
  generateImage,
  isImageGenerationRequest,
} from '../../../services/imageGenerationService';
import { ElevenLabsClient, createElevenLabsClient } from '../api/elevenLabsClient';
import { OpenRouterClient, buildMessageContent, createOpenRouterClient } from '../api/openRouterClient';
import { AVAILABLE_MODELS, Attachment, ChatSettings, Conversation, DEFAULT_VOICES, Message, VoiceState } from '../types';

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

interface ChatState {
  // User
  userId: string | null;
  
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  
  // Sync state
  isSyncing: boolean;
  lastSyncAt: number | null;
  
  // Settings
  settings: ChatSettings;
  
  // Voice state
  voiceState: VoiceState;
  
  // UI state
  isLoading: boolean;
  isSidebarOpen: boolean;
  error: string | null;
  
  // API clients
  openRouterClient: OpenRouterClient | null;
  elevenLabsClient: ElevenLabsClient | null;
  
  // Actions - User
  setUserId: (userId: string | null) => void;
  
  // Actions - Conversations
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  updateConversationTitle: (id: string, title: string) => void;
  
  // Actions - Messages
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, content: string, isStreaming?: boolean) => void;
  sendMessage: (content: string, attachments?: Attachment[]) => Promise<void>;
  
  // Actions - Sync
  syncWithCloud: () => Promise<void>;
  syncConversation: (conversationId: string) => Promise<void>;
  
  // Actions - Settings
  updateSettings: (settings: Partial<ChatSettings>) => void;
  initializeClients: () => void;
  
  // Actions - Voice
  setVoiceState: (state: Partial<VoiceState>) => void;
  speakMessage: (text: string) => Promise<void>;
  stopSpeaking: () => Promise<void>;
  
  // Actions - UI
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Computed
  getActiveConversation: () => Conversation | null;
}

const DEFAULT_SETTINGS: ChatSettings = {
  openRouterApiKey: '',
  openAiApiKey: '',
  elevenLabsApiKey: '',
  selectedModel: AVAILABLE_MODELS[1].id, // GPT-4o Mini
  temperature: 0.7,
  maxTokens: 4096,
  voiceEnabled: true,
  selectedVoice: DEFAULT_VOICES[0].voice_id,
  hapticFeedback: true,
};

const DEFAULT_VOICE_STATE: VoiceState = {
  isRecording: false,
  isPlaying: false,
  isSpeaking: false,
  audioLevel: 0,
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      userId: null,
      conversations: [],
      activeConversationId: null,
      isSyncing: false,
      lastSyncAt: null,
      settings: DEFAULT_SETTINGS,
      voiceState: DEFAULT_VOICE_STATE,
      isLoading: false,
      isSidebarOpen: false,
      error: null,
      openRouterClient: null,
      elevenLabsClient: null,

      // Set user ID (called when user logs in)
      setUserId: (userId: string | null) => {
        const currentUserId = get().userId;
        
        // If user changed (logout or different user), clear conversations
        if (currentUserId !== userId) {
          console.log('User changed, clearing conversations. Old:', currentUserId, 'New:', userId);
          set({ 
            userId,
            conversations: [],
            activeConversationId: null,
            lastSyncAt: null,
          });
        } else {
          set({ userId });
        }
        
        // Sync with cloud when user logs in
        if (userId) {
          console.log('User logged in, syncing:', userId);
          // Small delay to ensure session is stored
          setTimeout(() => get().syncWithCloud(), 500);
        }
      },

      // Initialize API clients
      initializeClients: () => {
        set({
          openRouterClient: apiKeys.openRouter 
            ? createOpenRouterClient(apiKeys.openRouter) 
            : null,
          elevenLabsClient: apiKeys.elevenLabs 
            ? createElevenLabsClient(apiKeys.elevenLabs) 
            : null,
        });
      },

      // Sync all conversations with Supabase
      syncWithCloud: async () => {
        const { userId, conversations, isSyncing } = get();
        if (!userId || isSyncing) return;

        set({ isSyncing: true });
        try {
          // Fetch conversations from cloud
          const cloudConversations = await fetchConversationsFromCloud(userId);
          
          // Merge with local conversations (newer wins, filtered by userId)
          const merged = mergeConversations(conversations, cloudConversations, userId);
          
          // Update local state
          set({ 
            conversations: merged,
            lastSyncAt: Date.now(),
          });

          // Sync any local-only conversations to cloud
          for (const conv of merged) {
            if (conv.syncStatus === 'pending' || !conv.syncedAt) {
              await syncConversationToCloud(conv, userId);
              set((state) => ({
                conversations: state.conversations.map((c) =>
                  c.id === conv.id 
                    ? { ...c, syncStatus: 'synced' as const, syncedAt: Date.now() }
                    : c
                ),
              }));
            }
          }
        } catch (error) {
          console.error('Sync failed:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      // Sync a single conversation
      syncConversation: async (conversationId: string) => {
        const { userId, conversations } = get();
        if (!userId) return;

        const conversation = conversations.find((c) => c.id === conversationId);
        if (!conversation) return;

        try {
          const success = await syncConversationToCloud(conversation, userId);
          if (success) {
            set((state) => ({
              conversations: state.conversations.map((c) =>
                c.id === conversationId
                  ? { ...c, syncStatus: 'synced' as const, syncedAt: Date.now() }
                  : c
              ),
            }));
          }
        } catch (error) {
          console.error('Failed to sync conversation:', error);
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === conversationId
                ? { ...c, syncStatus: 'error' as const }
                : c
            ),
          }));
        }
      },

      // Conversation actions
      createConversation: () => {
        const { userId } = get();
        const id = generateId();
        const newConversation: Conversation = {
          id,
          title: 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: get().settings.selectedModel,
          userId: userId || undefined,
          syncStatus: 'pending',
        };
        
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: id,
        }));
        
        return id;
      },

      deleteConversation: (id: string) => {
        const { userId } = get();
        
        set((state) => {
          const newConversations = state.conversations.filter((c) => c.id !== id);
          const newActiveId = state.activeConversationId === id 
            ? (newConversations[0]?.id || null)
            : state.activeConversationId;
          
          return {
            conversations: newConversations,
            activeConversationId: newActiveId,
          };
        });

        // Delete from cloud in background
        if (userId) {
          deleteConversationFromCloud(id).catch(console.error);
        }
      },

      setActiveConversation: (id: string | null) => {
        set({ activeConversationId: id, isSidebarOpen: false });
      },

      updateConversationTitle: (id: string, title: string) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: Date.now() } : c
          ),
        }));
      },

      // Message actions
      addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => {
        const { activeConversationId } = get();
        if (!activeConversationId) return;

        const newMessage: Message = {
          ...message,
          id: generateId(),
          timestamp: Date.now(),
        };

        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === activeConversationId
              ? { ...c, messages: [...c.messages, newMessage], updatedAt: Date.now() }
              : c
          ),
        }));
      },

      updateMessage: (id: string, content: string, isStreaming?: boolean) => {
        const { activeConversationId } = get();
        if (!activeConversationId) return;

        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === activeConversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === id ? { ...m, content, isStreaming } : m
                  ),
                  updatedAt: Date.now(),
                }
              : c
          ),
        }));
      },

      sendMessage: async (content: string, attachments?: Attachment[]) => {
        const { 
          activeConversationId, 
          settings, 
          openRouterClient,
          userId,
          addMessage,
          updateMessage,
          updateConversationTitle,
          setLoading,
          setError,
          getActiveConversation,
          createConversation,
        } = get();

        if (!openRouterClient) {
          setError('Please configure your OpenRouter API key in settings');
          return;
        }

        // Create new conversation if none active
        let conversationId = activeConversationId;
        if (!conversationId) {
          conversationId = createConversation();
        }

        // Generate message ID for attachments
        const userMessageId = generateId();

        // Upload attachments to Supabase Storage (if user is logged in)
        let uploadedAttachments = attachments;
        if (attachments?.length && userId) {
          try {
            uploadedAttachments = await uploadAttachments(attachments, userId, userMessageId);
            console.log('✓ Uploaded', uploadedAttachments.length, 'attachments');
          } catch (error) {
            console.error('Failed to upload attachments:', error);
            // Continue with local attachments if upload fails
          }
        }

        // Build user message with attachments
        const userMessage: Message = {
          id: userMessageId,
          role: 'user',
          content,
          timestamp: Date.now(),
          attachments: uploadedAttachments?.length ? uploadedAttachments : undefined,
        };

        // Add user message directly (with pre-generated ID)
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [...c.messages, userMessage], updatedAt: Date.now() }
              : c
          ),
        }));

        // Create placeholder for assistant response
        const assistantMessageId = generateId();
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          isStreaming: true,
        };

        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: Date.now() }
              : c
          ),
        }));

        setLoading(true);
        setError(null);

        try {
          // Check if this is an image generation request
          if (isImageGenerationRequest(content)) {
            const imagePrompt = extractImagePrompt(content);
            
            // Update assistant message to show generating status
            updateMessage(assistantMessageId, '🎨 Generating image...', true);
            
            try {
              const result = await generateImage(imagePrompt, apiKeys.openAi);
              
              if (result) {
                // Upload generated image to cloud storage (if user is logged in)
                let generatedAttachment: Attachment;
                
                if (userId) {
                  updateMessage(assistantMessageId, '🎨 Uploading image to cloud...', true);
                  const uploaded = await uploadGeneratedImage(
                    result.url,
                    userId,
                    assistantMessageId,
                    'generated-image.png'
                  );
                  generatedAttachment = uploaded || {
                    id: generateId(),
                    type: 'image',
                    uri: result.url,
                    name: 'generated-image.png',
                    mimeType: 'image/png',
                  };
                } else {
                  // Not logged in - use original URL
                  generatedAttachment = {
                    id: generateId(),
                    type: 'image',
                    uri: result.url,
                    name: 'generated-image.png',
                    mimeType: 'image/png',
                  };
                }
                
                // Update message with generated image
                const responseText = result.revisedPrompt 
                  ? `Here's your image!\n\n*Prompt used: ${result.revisedPrompt}*`
                  : "Here's your generated image!";
                
                set((state) => ({
                  conversations: state.conversations.map((c) =>
                    c.id === conversationId
                      ? {
                          ...c,
                          messages: c.messages.map((m) =>
                            m.id === assistantMessageId
                              ? { ...m, content: responseText, attachments: [generatedAttachment], isStreaming: false }
                              : m
                          ),
                          updatedAt: Date.now(),
                        }
                      : c
                  ),
                }));
              } else {
                updateMessage(assistantMessageId, "Sorry, I couldn't generate that image. Please try again.", false);
              }
            } catch (imgError: any) {
              updateMessage(
                assistantMessageId, 
                `Image generation failed: ${imgError.message || 'Unknown error'}. Make sure you have a valid OpenAI API key configured.`,
                false
              );
            }
          } else {
            // Regular chat completion
          // Get current conversation for context
          const conversation = get().conversations.find(c => c.id === conversationId);
          if (!conversation) return;

          // Build messages for API (with multimodal support)
          const apiMessages = conversation.messages
            .filter(m => m.id !== assistantMessageId)
            .map(m => ({
              role: m.role,
              content: buildMessageContent(m.content, m.attachments),
            }));

          // Stream response with real-time updates!
          let fullContent = '';
          
          await new Promise<void>((resolve, reject) => {
            const cleanup = openRouterClient.streamChatCompletionWithCallback(
              apiMessages,
              settings.selectedModel,
              settings.temperature,
              settings.maxTokens,
              // onChunk - called for each streamed token
              (chunk: string) => {
                fullContent += chunk;
                updateMessage(assistantMessageId, fullContent, true);
              },
              // onDone - called when stream completes
              () => {
                updateMessage(assistantMessageId, fullContent, false);
                resolve();
              },
              // onError - called on error
              (error: Error) => {
                reject(error);
              }
            );
            
            // Store cleanup in case we need to cancel
            // (could be extended to support cancellation)
          });
          }

          // Generate title if this is the first message
          const currentConversation = get().conversations.find(c => c.id === conversationId);
          if (currentConversation && currentConversation.messages.length <= 2 && currentConversation.title === 'New Chat') {
            try {
              const title = await openRouterClient.generateTitle(content);
              updateConversationTitle(conversationId!, title);
            } catch {
              // Keep default title on error
            }
          }

          // Mark conversation as pending sync and sync in background
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === conversationId
                ? { ...c, syncStatus: 'pending' as const, updatedAt: Date.now() }
                : c
            ),
          }));
          
          // Background sync
          get().syncConversation(conversationId!);
        } catch (error: any) {
          setError(error.message || 'Failed to send message');
          // Remove the failed assistant message
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === conversationId
                ? { ...c, messages: c.messages.filter(m => m.id !== assistantMessageId) }
                : c
            ),
          }));
        } finally {
          setLoading(false);
        }
      },

      // Settings actions
      updateSettings: (newSettings: Partial<ChatSettings>) => {
        set((state) => {
          const updatedSettings = { ...state.settings, ...newSettings };
          
          // Update clients if API keys changed
          let openRouterClient = state.openRouterClient;
          let elevenLabsClient = state.elevenLabsClient;
          
          if (newSettings.openRouterApiKey !== undefined) {
            openRouterClient = newSettings.openRouterApiKey 
              ? createOpenRouterClient(newSettings.openRouterApiKey)
              : null;
          }
          
          if (newSettings.elevenLabsApiKey !== undefined) {
            elevenLabsClient = newSettings.elevenLabsApiKey
              ? createElevenLabsClient(newSettings.elevenLabsApiKey)
              : null;
          }
          
          return {
            settings: updatedSettings,
            openRouterClient,
            elevenLabsClient,
          };
        });
      },

      // Voice actions
      setVoiceState: (state: Partial<VoiceState>) => {
        set((prev) => ({
          voiceState: { ...prev.voiceState, ...state },
        }));
      },

      speakMessage: async (text: string) => {
        const { elevenLabsClient, settings, setVoiceState } = get();
        
        // Check if API key exists in settings
        if (!settings.elevenLabsApiKey) {
          throw new Error('ElevenLabs API key not configured. Please add it in Settings.');
        }

        // Create client if it doesn't exist but key is present
        let client = elevenLabsClient;
        if (!client && settings.elevenLabsApiKey) {
          console.log('Creating ElevenLabs client from settings...');
          client = createElevenLabsClient(settings.elevenLabsApiKey);
          // Update the store with the new client
          set({ elevenLabsClient: client });
        }

        if (!client) {
          throw new Error('Failed to initialize ElevenLabs client');
        }

        await client.speak(
          text,
          settings.selectedVoice,
          () => setVoiceState({ isSpeaking: true }),
          () => setVoiceState({ isSpeaking: false })
        );
      },

      stopSpeaking: async () => {
        const { elevenLabsClient, setVoiceState } = get();
        
        if (elevenLabsClient) {
          await elevenLabsClient.stop();
        }
        setVoiceState({ isSpeaking: false });
      },

      // UI actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open: boolean) => set({ isSidebarOpen: open }),

      // Computed
      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.id === activeConversationId) || null;
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Persist everything needed for offline access
        userId: state.userId,
        conversations: state.conversations,
        settings: state.settings,
        activeConversationId: state.activeConversationId,
        lastSyncAt: state.lastSyncAt,
      }),
      onRehydrateStorage: () => (state) => {
        // Initialize clients after rehydration
        if (state) {
          state.initializeClients();
          // Sync with cloud if user is logged in
          if (state.userId) {
            setTimeout(() => state.syncWithCloud(), 1000);
          }
        }
      },
    }
  )
);

