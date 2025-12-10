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
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useChatStore } from '../store/chatStore';

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
    try {
      // Check if OpenAI API key is set
      if (!settings.openAiApiKey) {
        setError('Add OpenAI API key in Settings first');
        return;
      }

      if (settings.hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      setError(null);
      setTranscript('');
      setResponse('');

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setError('Microphone permission denied');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsListening(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording');
    }
  };

  const stopListening = async () => {
    if (!recording) return;

    try {
      if (settings.hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      setIsListening(false);
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
        
        // Wait a moment for the message to be fully saved and streamed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get the AI response from the latest message in the conversation
        const conversation = getActiveConversation();
        const assistantMessage = conversation?.messages
          .slice()
          .reverse()
          .find(m => m.role === 'assistant' && !m.isStreaming);
        
        if (assistantMessage) {
          setResponse(assistantMessage.content);
          setIsProcessing(false);
          setIsSpeaking(true);

          // Speak the response
          if (settings.elevenLabsApiKey) {
            try {
              await speakMessage(assistantMessage.content);
            } catch (err) {
              console.log('TTS error:', err);
            }
          }

          setIsSpeaking(false);
        } else {
          // If no response yet, wait a bit more
          setTimeout(() => {
            const updatedConversation = getActiveConversation();
            const updatedAssistantMessage = updatedConversation?.messages
              .slice()
              .reverse()
              .find(m => m.role === 'assistant' && !m.isStreaming);
            
            if (updatedAssistantMessage) {
              setResponse(updatedAssistantMessage.content);
              setIsProcessing(false);
              setIsSpeaking(true);
              
              if (settings.elevenLabsApiKey) {
                speakMessage(updatedAssistantMessage.content).catch(console.log);
              }
              
              setIsSpeaking(false);
            } else {
              setError('No response received');
              setIsProcessing(false);
            }
          }, 2000);
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
    onClose();
  };

  const getStatusText = () => {
    if (isListening) return 'Listening...';
    if (isProcessing) return 'Processing...';
    if (isSpeaking) return 'Speaking...';
    if (error) return 'Tap to try again';
    return 'Hold to speak';
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
              onPressIn={startListening}
              onPressOut={stopListening}
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
              {error ? 'Tap the button to try again' : 'Hold to speak, release to send'}
            </Text>
          </Animated.View>
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
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
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
});
