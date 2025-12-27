/**
 * ElevenLabs API Client
 * Handles text-to-speech synthesis
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
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

      // Save audio to file instead of using data URI (more reliable)
      const arrayBuffer = await response.arrayBuffer();
      const base64 = this.arrayBufferToBase64(arrayBuffer);
      
      // Save to cache directory
      const fileUri = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: 'base64',
      });

      console.log('Audio saved to:', fileUri);

      // Configure audio session for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Create and play the sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { 
          shouldPlay: true,
          volume: 1.0,
          isMuted: false,
        },
        (status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              console.log('Audio playback finished');
              onEnd?.();
              // Clean up file after playback
              FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
            }
          } else if ('error' in status) {
            console.error('Audio playback error:', status.error);
          }
        }
      );

      this.sound = sound;
      onStart?.();
      console.log('Audio playback started');
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
        const status = await this.sound.getStatusAsync();
        if (status.isLoaded) {
          await this.sound.stopAsync();
          await this.sound.unloadAsync();
        }
      } catch (error) {
        // Ignore errors when stopping - audio might already be stopped
        console.log('Error stopping audio (ignored):', error);
      } finally {
        this.sound = null;
      }
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

