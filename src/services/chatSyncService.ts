/**
 * Chat Sync Service
 * Handles syncing conversations with Supabase
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Attachment, Conversation, Message } from '../features/chat/types';
import { saveAttachmentMetadata } from './attachmentService';

// Supabase table types
interface SupabaseConversation {
  id: string;
  user_id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
}

interface SupabaseMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface SupabaseAttachment {
  id: string;
  message_id: string;
  user_id: string;
  type: 'image' | 'file';
  name: string;
  mime_type: string;
  size: number | null;
  storage_path: string;
  url: string | null;
}

/**
 * Sync a conversation to Supabase
 */
export const syncConversationToCloud = async (
  conversation: Conversation,
  userId: string
): Promise<boolean> => {
  if (!isSupabaseConfigured() || !userId) return false;

  try {
    console.log('Syncing:', conversation.id);

    const { error: convError } = await supabase
      .from('conversations')
      .upsert({
        id: conversation.id,
        user_id: userId,
        title: conversation.title,
        model: conversation.model,
        created_at: new Date(conversation.createdAt).toISOString(),
        updated_at: new Date(conversation.updatedAt).toISOString(),
      });

    if (convError) {
      console.error('Conversation upsert error:', convError);
      throw convError;
    }

    // Upsert messages with conflict resolution
    const messages = conversation.messages.map((msg) => ({
      id: msg.id,
      conversation_id: conversation.id,
      role: msg.role,
      content: msg.content,
      created_at: new Date(msg.timestamp).toISOString(),
    }));

    if (messages.length > 0) {
      const { error: msgError } = await supabase
        .from('messages')
        .upsert(messages, {
          onConflict: 'id',
          ignoreDuplicates: false,
        });

      if (msgError) {
        console.error('Messages upsert error:', msgError);
        throw msgError;
      }

      // Sync attachments for each message
      for (const msg of conversation.messages) {
        if (msg.attachments && msg.attachments.length > 0) {
          for (const attachment of msg.attachments) {
            await saveAttachmentMetadata(attachment, msg.id, userId);
          }
        }
      }
    }

    console.log('✓ Conversation synced successfully:', conversation.id);
    return true;
  } catch (error) {
    console.error('Error syncing conversation:', error);
    return false;
  }
};

/**
 * Fetch conversations from Supabase for a user with pagination
 */
export const fetchConversationsFromCloud = async (
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ conversations: Conversation[]; hasMore: boolean }> => {
  if (!isSupabaseConfigured() || !userId) return { conversations: [], hasMore: false };

  try {
    console.log(`Fetching conversations (limit: ${limit}, offset: ${offset})...`);

    // Fetch one extra to check if there are more
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)  // Filter by user ID
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit); // Fetch limit + 1 to check hasMore

    if (convError) throw convError;
    if (!conversations) return { conversations: [], hasMore: false };

    // Check if there are more conversations
    const hasMore = conversations.length > limit;
    // If we fetched one extra, remove it
    const actualConversations = hasMore ? conversations.slice(0, limit) : conversations;

    // Fetch all messages for these conversations
    const conversationIds = actualConversations.map((c) => c.id);
    if (conversationIds.length === 0) {
      return { conversations: [], hasMore: false };
    }

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    // Fetch all attachments for these messages
    const messageIds = (messages || []).map((m) => m.id);
    let attachments: SupabaseAttachment[] = [];
    
    if (messageIds.length > 0) {
      const { data: attachmentData, error: attError } = await supabase
        .from('attachments')
        .select('*')
        .in('message_id', messageIds);

      if (!attError && attachmentData) {
        attachments = attachmentData;
      }
    }

    console.log(`✓ Fetched ${actualConversations.length} conversations from cloud (hasMore: ${hasMore})`);

    // Map to app format
    const mappedConversations = actualConversations.map((conv: SupabaseConversation) => {
      const convMessages = (messages || [])
        .filter((m: SupabaseMessage) => m.conversation_id === conv.id)
        .map((m: SupabaseMessage): Message => {
          // Get attachments for this message
          const msgAttachments = attachments
            .filter((a) => a.message_id === m.id)
            .map((a): Attachment => ({
              id: a.id,
              type: a.type,
              uri: a.url || a.storage_path,
              name: a.name,
              mimeType: a.mime_type,
              size: a.size || undefined,
            }));

          return {
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.created_at).getTime(),
            attachments: msgAttachments.length > 0 ? msgAttachments : undefined,
          };
        });

      return {
        id: conv.id,
        title: conv.title,
        messages: convMessages,
        createdAt: new Date(conv.created_at).getTime(),
        updatedAt: new Date(conv.updated_at).getTime(),
        model: conv.model,
        userId: conv.user_id, // Ensure userId is set from cloud data
      } as Conversation;
    });

    return { conversations: mappedConversations, hasMore };
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return { conversations: [], hasMore: false };
  }
};

/**
 * Delete a conversation from Supabase
 */
export const deleteConversationFromCloud = async (
  conversationId: string
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  try {
    console.log('Deleting conversation:', conversationId);

    // Delete messages first (due to foreign key)
    // RLS will ensure user can only delete their own messages
    const { error: msgError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (msgError) throw msgError;

    // Delete conversation - RLS handles auth
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
    
    console.log('✓ Conversation deleted:', conversationId);
    return true;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }
};

/**
 * Sync all local conversations to cloud
 */
export const syncAllConversationsToCloud = async (
  conversations: Conversation[],
  userId: string
): Promise<number> => {
  let syncedCount = 0;

  for (const conversation of conversations) {
    const success = await syncConversationToCloud(conversation, userId);
    if (success) syncedCount++;
  }

  return syncedCount;
};

/**
 * Merge cloud and local conversations
 * Cloud takes precedence for conflicts (based on updatedAt)
 * Filters out conversations that don't belong to the current user
 */
export const mergeConversations = (
  localConversations: Conversation[],
  cloudConversations: Conversation[],
  userId?: string
): Conversation[] => {
  const merged = new Map<string, Conversation>();

  // Add all local conversations (filter by userId if provided)
  localConversations.forEach((conv) => {
    // Only include if userId matches or userId is not set (for backward compatibility)
    if (!userId || !conv.userId || conv.userId === userId) {
      merged.set(conv.id, conv);
    }
  });

  // Merge/override with cloud conversations (newer wins)
  // Cloud conversations are already filtered by userId in fetchConversationsFromCloud
  cloudConversations.forEach((cloudConv) => {
    const existing = merged.get(cloudConv.id);
    if (!existing || cloudConv.updatedAt > existing.updatedAt) {
      merged.set(cloudConv.id, cloudConv);
    }
  });

  // Sort by updatedAt descending
  return Array.from(merged.values()).sort((a, b) => b.updatedAt - a.updatedAt);
};

export default {
  syncConversationToCloud,
  fetchConversationsFromCloud,
  deleteConversationFromCloud,
  syncAllConversationsToCloud,
  mergeConversations,
};

