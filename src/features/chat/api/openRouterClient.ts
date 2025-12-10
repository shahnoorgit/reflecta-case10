/**
 * OpenRouter API Client
 * Handles chat completions with streaming support for React Native
 * Supports vision models with image attachments
 */

import { OpenRouterMessage, OpenRouterMessageContent, OpenRouterRequest, Attachment } from '../types';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Convert attachments to OpenRouter multimodal content format
 * Supports both images and documents (PDFs)
 */
export const buildMessageContent = (
  text: string,
  attachments?: Attachment[]
): string | OpenRouterMessageContent[] => {
  // Filter attachments with base64 data
  const imageAttachments = attachments?.filter(a => a.type === 'image' && a.base64) || [];
  const fileAttachments = attachments?.filter(a => a.type === 'file' && a.base64) || [];
  
  // If no attachments with data, return plain text
  if (imageAttachments.length === 0 && fileAttachments.length === 0) {
    return text;
  }

  // Build multimodal content array
  const content: OpenRouterMessageContent[] = [];

  // Add images
  for (const img of imageAttachments) {
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:${img.mimeType};base64,${img.base64}`,
      },
    });
  }

  // Add files (PDFs, documents) - using file type for Claude/Anthropic models
  for (const file of fileAttachments) {
    // For PDFs and documents, use the file content type
    // This format is supported by Claude models via OpenRouter
    if (file.mimeType === 'application/pdf') {
      content.push({
        type: 'file',
        file: {
          filename: file.name,
          file_data: `data:${file.mimeType};base64,${file.base64}`,
        },
      } as OpenRouterMessageContent);
    } else {
      // For other file types, include as text description with the content
      // or try as a generic file
      content.push({
        type: 'file',
        file: {
          filename: file.name,
          file_data: `data:${file.mimeType};base64,${file.base64}`,
        },
      } as OpenRouterMessageContent);
    }
  }

  // Build the text part with file context
  let textContent = text;
  if (fileAttachments.length > 0) {
    const fileNames = fileAttachments.map(f => f.name).join(', ');
    // Add context about attached files to help the AI
    if (text) {
      textContent = `[Attached files: ${fileNames}]\n\n${text}`;
    } else {
      textContent = `[Attached files: ${fileNames}]\n\nPlease analyze the attached document(s).`;
    }
  }

  // Add text if present
  if (textContent) {
    content.push({
      type: 'text',
      text: textContent,
    });
  }

  return content;
};

export class OpenRouterClient {
  private apiKey: string;
  private abortController: AbortController | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Stream chat completion with callback using XMLHttpRequest
   * This approach works reliably in React Native!
   */
  streamChatCompletionWithCallback(
    messages: OpenRouterMessage[],
    model: string,
    temperature: number = 0.7,
    maxTokens: number = 4096,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (error: Error) => void
  ): () => void {
    const request: OpenRouterRequest = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    };

    const xhr = new XMLHttpRequest();
    let lastIndex = 0;
    let isDone = false;

    xhr.open('POST', `${OPENROUTER_BASE_URL}/chat/completions`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${this.apiKey}`);
    xhr.setRequestHeader('HTTP-Referer', 'https://reflecta-chat.app');
    xhr.setRequestHeader('X-Title', 'Reflecta Chat');

    xhr.onprogress = () => {
      if (isDone) return;
      
      const newData = xhr.responseText.substring(lastIndex);
      lastIndex = xhr.responseText.length;

      // Parse SSE data
      const lines = newData.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') {
          if (trimmed === 'data: [DONE]') {
            isDone = true;
          }
          continue;
        }
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            onChunk(content);
          }
        } catch (e) {
          // Skip malformed JSON
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onDone();
      } else {
        onError(new Error(`API error: ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      onError(new Error('Network error'));
    };

    xhr.send(JSON.stringify(request));

    // Return cleanup function
    return () => {
      isDone = true;
      xhr.abort();
    };
  }

  /**
   * Send a non-streaming chat completion request
   */
  async chatCompletion(
    messages: OpenRouterMessage[],
    model: string,
    temperature: number = 0.7,
    maxTokens: number = 4096
  ): Promise<string> {
    const request: OpenRouterRequest = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    };

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://reflecta-chat.app',
        'X-Title': 'Reflecta Chat',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Generate a conversation title from the first message
   */
  async generateTitle(firstMessage: string): Promise<string> {
    const prompt = `Generate a very short (3-5 words max) title for a conversation that starts with: "${firstMessage.slice(0, 200)}". Return ONLY the title, nothing else.`;
    
    try {
      const title = await this.chatCompletion(
        [{ role: 'user', content: prompt }],
        'openai/gpt-4o-mini',
        0.5,
        50
      );
      return title.trim().replace(/^["']|["']$/g, '');
    } catch {
      return firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '');
    }
  }
}

export const createOpenRouterClient = (apiKey: string) => new OpenRouterClient(apiKey);

