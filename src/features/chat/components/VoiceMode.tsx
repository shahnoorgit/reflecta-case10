/**
 * VoiceMode Component
 * Full-screen voice interaction mode with animated visualizations
 */

import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useChatStore } from '../store/chatStore';
import { parseElevenLabsError } from '../../../utils/errorUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = SCREEN_WIDTH * 0.5;

interface VoiceModeProps {
  visible: boolean;
  onClose: () => void;
}

export const VoiceMode: React.FC<VoiceModeProps> = ({ visible, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Silence detection refs
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAudioLevelRef = useRef(0);
  const silenceStartTimeRef = useRef<number | null>(null);
  const hasDetectedSpeechRef = useRef(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { settings, openRouterClient, speakMessage, stopSpeaking, getActiveConversation, sendMessage } = useChatStore();

  useEffect(() => {
    if (visible) {
      setTranscript('');
      setResponse('');
      setError(null);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    
    if (isListening) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else if (isProcessing) {
      animation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
    }
    
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isListening, isProcessing]);

  const transcribeWithWhisper = async (audioUri: string): Promise<string> => {
    // Use OpenAI API key for Whisper
    const apiKey = settings.openAiApiKey;
    
    if (!apiKey) {
      throw new Error('Add OpenAI API key in Settings for voice');
    }

    try {
      // React Native FormData with file object
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      formData.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          // Don't set Content-Type - let fetch set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Whisper API error:', errorText);
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      return data.text || '';
    } catch (err) {
      console.error('Transcription error:', err);
      throw err;
    }
  };

  const startListening = async () => {
    // If already listening, stop it
    if (isListening && recording) {
      await stopListening();
      return;
    }

    try {
      // Check if OpenAI API key is set
      if (!settings.openAiApiKey) {
        setError('Add OpenAI API key in Settings first');
        return;
      }

      if (settings.hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      setError(null);
      setTranscript('');
      setResponse('');
      setAudioLevel(0);
      lastAudioLevelRef.current = 0;
      silenceStartTimeRef.current = null;
      hasDetectedSpeechRef.current = false;

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setError('Microphone permission denied');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          isMeteringEnabled: true, // Enable audio level monitoring
        }
      );

      // Monitor audio levels for silence detection
      newRecording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering !== undefined) {
          // Convert metering (-160 to 0 dB) to 0-1 scale
          const normalizedLevel = Math.max(0, (status.metering + 160) / 160);
          setAudioLevel(normalizedLevel);
          
          // Detect if user has started speaking (audio above threshold)
          const SPEECH_THRESHOLD = 0.08; // Minimum level to consider as speech
          if (normalizedLevel > SPEECH_THRESHOLD) {
            hasDetectedSpeechRef.current = true;
          }
          
          // Detect silence (very low audio level) - only after speech detected
          const SILENCE_THRESHOLD = 0.05; // Very quiet
          const SILENCE_DURATION = 2000; // 2 seconds of silence
          
          if (hasDetectedSpeechRef.current && normalizedLevel < SILENCE_THRESHOLD) {
            // Start or continue silence timer
            if (silenceStartTimeRef.current === null) {
              silenceStartTimeRef.current = Date.now();
            } else {
              const silenceDuration = Date.now() - silenceStartTimeRef.current;
              if (silenceDuration >= SILENCE_DURATION) {
                // Auto-stop after silence (only if speech was detected)
                stopListening();
              }
            }
          } else {
            // Audio detected, reset silence timer
            silenceStartTimeRef.current = null;
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
          }
          
          lastAudioLevelRef.current = normalizedLevel;
        }
      });

      setRecording(newRecording);
      setIsListening(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording');
    }
  };

  const stopListening = async () => {
    if (!recording) return;

    try {
      // Clear silence detection timers
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      silenceStartTimeRef.current = null;

      if (settings.hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      setIsListening(false);
      setAudioLevel(0);
      setIsProcessing(true);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        throw new Error('No audio recorded');
      }

      // Transcribe the audio
      setTranscript('Transcribing...');
      
      let transcribedText: string;
      try {
        transcribedText = await transcribeWithWhisper(uri);
      } catch (err: any) {
        // If Whisper fails, show specific error
        setTranscript('');
        const errorMsg = err.message || 'Transcription failed';
        if (errorMsg.includes('OpenAI API key')) {
          setError('Add your OpenAI API key in Settings → API Keys');
        } else {
          setError('Transcription failed. Check your OpenAI API key.');
        }
        setIsProcessing(false);
        return;
      }

      if (!transcribedText.trim()) {
        setTranscript('');
        setError('Could not understand audio. Please try again.');
        setIsProcessing(false);
        return;
      }

      setTranscript(transcribedText);

      // Get AI response
      if (!openRouterClient) {
        setError('Chat not configured');
        setIsProcessing(false);
        return;
      }

      setResponse('Thinking...');

      // Save the transcribed message and get AI response using sendMessage
      // This will automatically save to chat store and sync to cloud
      try {
        // Use sendMessage which handles everything: saving, streaming, and cloud sync
        await sendMessage(transcribedText);
        
        // Wait for streaming to complete - poll until we get a non-streaming assistant message
        let assistantMessage = null;
        let attempts = 0;
        const maxAttempts = 30; // 15 seconds max wait (30 * 500ms)
        
        while (!assistantMessage && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const conversation = getActiveConversation();
          assistantMessage = conversation?.messages
            .slice()
            .reverse()
            .find(m => m.role === 'assistant' && !m.isStreaming && m.content.trim().length > 0);
          
          attempts++;
        }
        
        if (assistantMessage) {
          setResponse(assistantMessage.content);
          setIsProcessing(false);

          // Speak the response
          if (settings.elevenLabsApiKey) {
            setIsSpeaking(true);
            try {
              console.log('Starting TTS for:', assistantMessage.content.slice(0, 50) + '...');
              // speakMessage will automatically stop any existing playback
              await speakMessage(assistantMessage.content);
              console.log('TTS completed');
            } catch (err: any) {
              console.error('TTS error:', err);
              const errorInfo = parseElevenLabsError(err);
              setError(errorInfo.message);
            } finally {
              setIsSpeaking(false);
            }
          } else {
            console.log('ElevenLabs API key not configured - skipping TTS');
          }
        } else {
          setError('No response received from AI');
          setIsProcessing(false);
        }
      } catch (err: any) {
        console.error('Failed to send voice message:', err);
        setError(err.message || 'Failed to send message');
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error('Voice mode error:', err);
      setError(err.message || 'Something went wrong');
      setIsProcessing(false);
      setIsListening(false);
    }
  };

  const handleClose = async () => {
    // Clear any timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    await stopSpeaking();
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch {}
      setRecording(null);
    }
    setIsListening(false);
    setIsProcessing(false);
    setIsSpeaking(false);
    setTranscript('');
    setResponse('');
    setError(null);
    setAudioLevel(0);
    onClose();
  };

  const getStatusText = () => {
    if (isListening) return 'Listening...';
    if (isProcessing) return 'Processing...';
    if (isSpeaking) return 'Speaking...';
    if (error) return 'Tap to try again';
    return 'Tap to speak';
  };

  const getStatusColor = () => {
    if (error) return '#FF6B6B';
    if (isListening) return '#10A37F';
    if (isProcessing) return '#9B8AFF';
    if (isSpeaking) return '#6B5BFF';
    return '#8E8EA0';
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#0F0F1E', '#1A1A2E', '#16162A']}
          style={styles.background}
        >
          {/* Close Button */}
          <Animated.View style={[styles.closeButtonContainer, { opacity: fadeAnim }]}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#ECECF1" />
            </TouchableOpacity>
          </Animated.View>

          {/* Status Text */}
          <Animated.View style={[styles.statusContainer, { opacity: fadeAnim }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </Animated.View>

          {/* Main Voice Circle */}
          <Animated.View
            style={[
              styles.circleContainer,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            {/* Animated Rings when listening */}
            {isListening && (
              <>
                {[1, 2, 3].map((ring) => (
                  <Animated.View
                    key={ring}
                    style={[
                      styles.ring,
                      {
                        width: CIRCLE_SIZE + ring * 30,
                        height: CIRCLE_SIZE + ring * 30,
                        borderRadius: (CIRCLE_SIZE + ring * 30) / 2,
                        opacity: pulseAnim.interpolate({
                          inputRange: [1, 1.15],
                          outputRange: [0.4 - ring * 0.1, 0.1],
                        }),
                        transform: [{
                          scale: pulseAnim.interpolate({
                            inputRange: [1, 1.15],
                            outputRange: [1, 1.1],
                          }),
                        }],
                      },
                    ]}
                  />
                ))}
              </>
            )}

            {/* Main Circle Button */}
            <TouchableOpacity
              style={styles.mainCircle}
              onPress={startListening}
              activeOpacity={0.9}
              disabled={isProcessing || isSpeaking}
            >
              <Animated.View
                style={[
                  styles.circleInner,
                  isListening && { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <LinearGradient
                  colors={
                    error
                      ? ['#FF6B6B', '#FF4444']
                      : isListening
                        ? ['#10A37F', '#0D8A6A']
                        : isProcessing
                          ? ['#9B8AFF', '#6B5BFF']
                          : ['#3D3D4A', '#2D2D3A']
                  }
                  style={styles.circleGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Animated.View
                    style={isProcessing ? { transform: [{ rotate: spin }] } : undefined}
                  >
                    <Ionicons
                      name={
                        isListening
                          ? 'mic'
                          : isProcessing
                            ? 'sync'
                            : isSpeaking
                              ? 'volume-high'
                              : error
                                ? 'alert-circle'
                                : 'mic-outline'
                      }
                      size={40}
                      color="#FFFFFF"
                    />
                  </Animated.View>
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>

          {/* Transcript/Response Display */}
          <Animated.View style={[styles.transcriptContainer, { opacity: fadeAnim }]}>
            {error && (
              <View style={styles.errorBubble}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            {transcript && !error && (
              <View style={styles.transcriptBubble}>
                <Text style={styles.transcriptLabel}>You:</Text>
                <Text style={styles.transcriptText}>{transcript}</Text>
              </View>
            )}
            {response && !error && (
              <View style={styles.responseBubble}>
                <Text style={styles.responseLabel}>AI:</Text>
                <Text style={styles.responseText} numberOfLines={4}>{response}</Text>
              </View>
            )}
          </Animated.View>

          {/* Instructions */}
          <Animated.View style={[styles.instructionsContainer, { opacity: fadeAnim }]}>
            <Text style={styles.instructions}>
              {error 
                ? 'Tap the button to try again' 
                : isListening 
                  ? 'Tap again to stop, or wait for silence'
                  : 'Tap to start speaking'}
            </Text>
          </Animated.View>
          
          {/* Audio Level Indicator (when listening) */}
          {isListening && (
            <Animated.View 
              style={[
                styles.audioLevelIndicator,
                { 
                  opacity: fadeAnim,
                  transform: [{ scale: 0.5 + audioLevel * 0.5 }] 
                }
              ]}
            >
              <View 
                style={[
                  styles.audioLevelBar,
                  { 
                    width: `${Math.min(100, audioLevel * 100)}%`,
                    backgroundColor: audioLevel > 0.1 ? '#10A37F' : '#5A5A6A'
                  }
                ]} 
              />
            </Animated.View>
          )}
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(142, 142, 160, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    position: 'absolute',
    top: 110,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: CIRCLE_SIZE + 120,
    height: CIRCLE_SIZE + 120,
  },
  mainCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
  },
  circleInner: {
    width: '100%',
    height: '100%',
    borderRadius: CIRCLE_SIZE / 2,
    shadowColor: '#9B8AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  circleGradient: {
    flex: 1,
    borderRadius: CIRCLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#10A37F',
  },
  transcriptContainer: {
    position: 'absolute',
    bottom: 140,
    left: 20,
    right: 20,
    maxHeight: 180,
  },
  errorBubble: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  errorTitle: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  errorActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.4)',
  },
  errorActionText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '600',
  },
  transcriptBubble: {
    backgroundColor: 'rgba(16, 163, 127, 0.15)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  transcriptLabel: {
    color: '#10A37F',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  transcriptText: {
    color: '#ECECF1',
    fontSize: 14,
    lineHeight: 20,
  },
  responseBubble: {
    backgroundColor: 'rgba(155, 138, 255, 0.15)',
    borderRadius: 16,
    padding: 14,
  },
  responseLabel: {
    color: '#9B8AFF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  responseText: {
    color: '#ECECF1',
    fontSize: 14,
    lineHeight: 20,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 70,
  },
  instructions: {
    color: '#5A5A6A',
    fontSize: 13,
    textAlign: 'center',
  },
  audioLevelIndicator: {
    position: 'absolute',
    bottom: 100,
    left: 40,
    right: 40,
    height: 4,
    backgroundColor: 'rgba(142, 142, 160, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  audioLevelBar: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.1s ease',
  },
});
