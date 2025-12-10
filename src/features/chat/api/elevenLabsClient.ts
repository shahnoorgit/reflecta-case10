/**
 * ElevenLabs API Client
 * Handles text-to-speech synthesis
 */

import { Audio } from 'expo-av';
import { ElevenLabsTTSRequest } from '../types';

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

export class ElevenLabsClient {
  private apiKey: string;
  private sound: Audio.Sound | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Convert text to speech and play it
   */
  async speak(
    text: string,
    voiceId: string = 'EXAVITQu4vr4xnSDxMaL', // Sarah - conversational
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Stop any currently playing audio
    await this.stop();

    const request: ElevenLabsTTSRequest = {
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true,
      },
    };

    try {
      const response = await fetch(
        `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
      }

      // Convert response to base64
      const arrayBuffer = await response.arrayBuffer();
      const base64 = this.arrayBufferToBase64(arrayBuffer);
      const uri = `data:audio/mpeg;base64,${base64}`;

      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Create and play the sound
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            onEnd?.();
          }
        }
      );

      this.sound = sound;
      onStart?.();
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw error;
    }
  }

  /**
   * Stop any currently playing audio
   */
  async stop(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch {
        // Ignore errors when stopping
      }
      this.sound = null;
    }
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.status}`);
    }

    const data = await response.json();
    return data.voices || [];
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

export const createElevenLabsClient = (apiKey: string) => new ElevenLabsClient(apiKey);

