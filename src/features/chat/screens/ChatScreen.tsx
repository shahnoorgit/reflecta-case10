/**
 * ChatScreen Component
 * Main chat interface with message list, input, and sidebar
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GLASS_COLORS, GLASS_SHADOWS } from '../../../theme/glassmorphism';
import { ChatHeader } from '../components/ChatHeader';
import { ChatInput } from '../components/ChatInput';
import { ConversationSidebar } from '../components/ConversationSidebar';
import { EmptyChat } from '../components/EmptyChat';
import { MessageBubble } from '../components/MessageBubble';
import { VoiceMode } from '../components/VoiceMode';
import { useChatStore } from '../store/chatStore';
import { Message } from '../types';
import { SettingsScreen } from './SettingsScreen';

export const ChatScreen: React.FC = () => {
  const flatListRef = useRef<FlatList>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const errorFadeAnim = useRef(new Animated.Value(0)).current;
  const scrollButtonAnim = useRef(new Animated.Value(0)).current;
  const lastContentHeight = useRef(0);
  const insets = useSafeAreaInsets();

  const {
    getActiveConversation,
    isLoading,
    error,
    setError,
    toggleSidebar,
    settings,
  } = useChatStore();

  const activeConversation = getActiveConversation();
  const messages = activeConversation?.messages || [];
  const lastMessage = messages[messages.length - 1];
  const isStreaming = lastMessage?.isStreaming;

  // Memoize reversed messages for inverted FlatList
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // Scroll to bottom (which is top in inverted list)
  const scrollToBottom = useCallback((animated = true) => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated });
  }, []);

  // Handle scroll events to detect if user scrolled away
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset } = event.nativeEvent;
    const nearBottom = contentOffset.y < 100; // In inverted list, 0 is bottom
    setIsNearBottom(nearBottom);
    
    if (!nearBottom && !isStreaming) {
      setShowScrollButton(true);
    } else {
      setShowScrollButton(false);
    }
  }, [isStreaming]);

  // Show/hide scroll button with animation
  useEffect(() => {
    Animated.spring(scrollButtonAnim, {
      toValue: showScrollButton ? 1 : 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [showScrollButton]);

  // Auto-scroll to bottom when new messages arrive (if user is near bottom)
  useEffect(() => {
    if (messages.length > 0 && isNearBottom) {
      scrollToBottom(true);
    }
  }, [messages.length, isNearBottom, scrollToBottom]);

  // Always scroll during streaming
  useEffect(() => {
    if (isStreaming) {
      scrollToBottom(false);
    }
  }, [lastMessage?.content, isStreaming, scrollToBottom]);

  // Scroll when content size changes during streaming
  const handleContentSizeChange = useCallback((width: number, height: number) => {
    if (isStreaming && height > lastContentHeight.current) {
      scrollToBottom(false);
    }
    lastContentHeight.current = height;
  }, [isStreaming, scrollToBottom]);

  // Show/hide error toast
  useEffect(() => {
    if (error) {
      Animated.timing(errorFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Show quota errors longer (8 seconds) vs regular errors (4 seconds)
      const duration = error.includes('quota') ? 8000 : 4000;
      const timer = setTimeout(() => {
        Animated.timing(errorFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setError(null));
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [error]);

  // Render message item (note: index is reversed in inverted list)
  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => (
    <MessageBubble
      message={item}
      isLast={index === 0} // First in reversed list = last message
    />
  ), []);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const handleSettingsPress = () => {
    setShowSettings(true);
  };

  const handleVoiceModePress = () => {
    if (settings?.elevenLabsApiKey) {
      setShowVoiceMode(true);
    } else {
      setError('Please add your ElevenLabs API key in settings to use voice mode');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F1E', '#16162A', '#0F0F1E']}
        style={styles.gradient}
        locations={[0, 0.5, 1]}
      >
        {/* Top Gradient Overlay - 30% of screen */}
        <LinearGradient
          colors={[
            'rgba(155, 138, 255, 0.15)',  // Purple accent at top
            'rgba(107, 91, 255, 0.08)',   // Deeper purple
            'rgba(16, 163, 127, 0.05)',   // Subtle green hint
            'transparent',                 // Fade to transparent
          ]}
          style={styles.topGradient}
          locations={[0, 0.3, 0.6, 1]}
        />
        
        {/* Floating Header */}
        <ChatHeader onMenuPress={toggleSidebar} />

        {/* Main Content */}
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.messagesContainer}>
            {messages.length === 0 ? (
              <EmptyChat />
            ) : (
              <>
                <FlatList
                  ref={flatListRef}
                  data={reversedMessages}
                  renderItem={renderMessage}
                  keyExtractor={keyExtractor}
                  style={styles.messageList}
                  contentContainerStyle={styles.messageListContent}
                  showsVerticalScrollIndicator={false}
                  inverted // Key: inverted list for chat
                  initialNumToRender={20}
                  maxToRenderPerBatch={15}
                  windowSize={15}
                  removeClippedSubviews={Platform.OS === 'android'}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="interactive"
                  onScrollBeginDrag={Keyboard.dismiss}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  onContentSizeChange={handleContentSizeChange}
                  extraData={lastMessage?.content} // Re-render on content change
                />

                {/* Scroll to Bottom Button */}
                <Animated.View
                  style={[
                    styles.scrollButtonContainer,
                    {
                      opacity: scrollButtonAnim,
                      transform: [
                        {
                          translateY: scrollButtonAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [100, 0],
                          }),
                        },
                        {
                          scale: scrollButtonAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                  pointerEvents={showScrollButton ? 'auto' : 'none'}
                >
                  <TouchableOpacity
                    style={styles.scrollButton}
                    onPress={() => scrollToBottom(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </Animated.View>
              </>
            )}
          </View>

          {/* Chat Input */}
          <ChatInput
            onVoiceModePress={settings?.voiceEnabled ? handleVoiceModePress : undefined}
          />
        </KeyboardAvoidingView>

        {/* Error Toast */}
        {error && (
          <Animated.View
            style={[
              styles.errorToast,
              { opacity: errorFadeAnim },
            ]}
          >
            <View style={styles.errorToastContent}>
              <View style={styles.errorToastHeader}>
                <Ionicons 
                  name={error.includes('quota') ? 'card-outline' : 'alert-circle'} 
                  size={20} 
                  color="#FFFFFF" 
                />
                <Text style={styles.errorToastTitle}>
                  {error.includes('quota') ? 'Quota Exceeded' : 'Error'}
                </Text>
              </View>
              <Text style={[styles.errorText, error.includes('quota') && { marginBottom: 12 }]}>{error}</Text>
              {error.includes('quota') && (
                <TouchableOpacity 
                  style={styles.errorToastButton}
                  onPress={() => {
                    Linking.openURL('https://elevenlabs.io/pricing');
                  }}
                >
                  <Text style={styles.errorToastButtonText}>Upgrade Plan</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}

        {/* Conversation Sidebar */}
        <ConversationSidebar onSettingsPress={handleSettingsPress} />

        {/* Settings Modal */}
        <SettingsScreen
          visible={showSettings}
          onClose={() => setShowSettings(false)}
        />

        {/* Voice Mode Modal */}
        <VoiceMode
          visible={showVoiceMode}
          onClose={() => setShowVoiceMode(false)}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1E',
  },
  gradient: {
    flex: 1,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    zIndex: 0,
    pointerEvents: 'none',
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  messagesContainer: {
    flex: 1,
    position: 'relative',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  scrollButtonContainer: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    zIndex: 100,
  },
  scrollButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GLASS_COLORS.purple.strong,
    borderWidth: 1,
    borderColor: GLASS_COLORS.purple.border.medium,
    justifyContent: 'center',
    alignItems: 'center',
    ...GLASS_SHADOWS.strong,
  },
  errorToast: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: GLASS_COLORS.error.background,
    borderWidth: 1,
    borderColor: GLASS_COLORS.error.border,
    borderRadius: 12,
    zIndex: 1000,
    ...GLASS_SHADOWS.strong,
  },
  errorToastContent: {
    padding: 16,
  },
  errorToastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  errorToastTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  errorToastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  errorToastButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

