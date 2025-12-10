/**
 * Whisper API Client
 * Handles speech-to-text transcription using OpenAI's Whisper
 */

import * as FileSystem from 'expo-file-system/legacy';

const OPENAI_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

export class WhisperClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Transcribe audio file to text
   */
  async transcribe(audioUri: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // Read the audio file
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Audio file not found');
      }

      // Create form data
      const formData = new FormData();
      
      // Add audio file
      const audioFile = {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      } as any;
      
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      // Send to Whisper API
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Whisper API error:', error);
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      return data.text || '';
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }
}

export const createWhisperClient = (apiKey: string) => new WhisperClient(apiKey);

