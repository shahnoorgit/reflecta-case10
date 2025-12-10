/**
 * Attachment Service
 * Handles uploading and managing attachments in Supabase Storage
 */

import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Attachment } from '../features/chat/types';

const BUCKET_NAME = 'chat-attachments';

/**
 * Upload an attachment to Supabase Storage
 */
export const uploadAttachment = async (
  attachment: Attachment,
  userId: string,
  messageId: string
): Promise<Attachment | null> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, skipping upload');
    return attachment; // Return original with local URI
  }

  try {
    // Generate storage path: userId/messageId/filename
    const ext = attachment.name.split('.').pop() || 'jpg';
    const storagePath = `${userId}/${messageId}/${attachment.id}.${ext}`;

    let base64Data = attachment.base64;

    // If no base64, read from URI (for PDFs and other files)
    if (!base64Data && attachment.uri) {
      try {
        base64Data = await FileSystem.readAsStringAsync(attachment.uri, {
          encoding: 'base64', // Use string directly, not enum
        });
      } catch (readError) {
        console.error('Failed to read file:', readError);
        return attachment;
      }
    }

    if (!base64Data) {
      console.error('No data to upload for attachment:', attachment.id);
      return attachment;
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, decode(base64Data), {
        contentType: attachment.mimeType,
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      return attachment; // Return original on failure
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    console.log('✓ Uploaded attachment:', attachment.name);

    // Return updated attachment with storage info
    return {
      ...attachment,
      uri: urlData.publicUrl,
      base64: base64Data, // Keep base64 for AI
    };
  } catch (error) {
    console.error('Failed to upload attachment:', error);
    return attachment;
  }
};

/**
 * Upload multiple attachments
 */
export const uploadAttachments = async (
  attachments: Attachment[],
  userId: string,
  messageId: string
): Promise<Attachment[]> => {
  if (!attachments.length) return [];

  const uploaded = await Promise.all(
    attachments.map((att) => uploadAttachment(att, userId, messageId))
  );

  return uploaded.filter((a): a is Attachment => a !== null);
};

/**
 * Save attachment metadata to database
 */
export const saveAttachmentMetadata = async (
  attachment: Attachment,
  messageId: string,
  userId: string
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase.from('attachments').upsert({
      id: attachment.id,
      message_id: messageId,
      user_id: userId,
      type: attachment.type,
      name: attachment.name,
      mime_type: attachment.mimeType,
      size: attachment.size,
      storage_path: attachment.uri,
      url: attachment.uri,
    });

    if (error) {
      console.error('Error saving attachment metadata:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to save attachment metadata:', error);
    return false;
  }
};

/**
 * Fetch attachments for a message
 */
export const fetchAttachmentsForMessage = async (
  messageId: string
): Promise<Attachment[]> => {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('message_id', messageId);

    if (error) {
      console.error('Error fetching attachments:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      type: row.type as 'image' | 'file',
      uri: row.url || row.storage_path,
      name: row.name,
      mimeType: row.mime_type,
      size: row.size,
    }));
  } catch (error) {
    console.error('Failed to fetch attachments:', error);
    return [];
  }
};

/**
 * Delete attachment from storage
 */
export const deleteAttachment = async (
  storagePath: string
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.error('Error deleting attachment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete attachment:', error);
    return false;
  }
};

/**
 * Upload a generated image from URL to Supabase Storage
 * Downloads the image and uploads it to permanent storage
 */
export const uploadGeneratedImage = async (
  imageUrl: string,
  userId: string,
  messageId: string,
  imageName: string = 'generated-image.png'
): Promise<Attachment | null> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, returning original URL');
    return {
      id: `gen-${Date.now()}`,
      type: 'image',
      uri: imageUrl,
      name: imageName,
      mimeType: 'image/png',
    };
  }

  try {
    console.log('Downloading generated image for cloud storage...');
    
    // Download the image as base64
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error('Failed to download image:', response.status);
      return {
        id: `gen-${Date.now()}`,
        type: 'image',
        uri: imageUrl,
        name: imageName,
        mimeType: 'image/png',
      };
    }

    // Get the image as blob then convert to base64
    const blob = await response.blob();
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64Clean = base64.split(',')[1];
        resolve(base64Clean);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Generate unique ID and storage path
    const attachmentId = `gen-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const storagePath = `${userId}/${messageId}/${attachmentId}.png`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, decode(base64Data), {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      // Return original URL on failure
      return {
        id: attachmentId,
        type: 'image',
        uri: imageUrl,
        name: imageName,
        mimeType: 'image/png',
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    console.log('✓ Generated image uploaded to cloud storage');

    return {
      id: attachmentId,
      type: 'image',
      uri: urlData.publicUrl,
      name: imageName,
      mimeType: 'image/png',
      base64: base64Data,
    };
  } catch (error) {
    console.error('Failed to upload generated image:', error);
    // Return original URL on failure
    return {
      id: `gen-${Date.now()}`,
      type: 'image',
      uri: imageUrl,
      name: imageName,
      mimeType: 'image/png',
    };
  }
};

export default {
  uploadAttachment,
  uploadAttachments,
  uploadGeneratedImage,
  saveAttachmentMetadata,
  fetchAttachmentsForMessage,
  deleteAttachment,
};

