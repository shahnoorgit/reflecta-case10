/**
 * MessageBubble Component
 * Renders individual chat messages with typing animation and actions
 */

import React, { useEffect, useRef, memo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Message, Attachment } from '../types';
import { useChatStore } from '../store/chatStore';

interface MessageBubbleProps {
  message: Message;
  isLast?: boolean;
}

// Animated typing dots component - smooth wave animation
const TypingDots = memo(() => {
  const dot1Y = useRef(new Animated.Value(0)).current;
  const dot2Y = useRef(new Animated.Value(0)).current;
  const dot3Y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dotY: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotY, {
            toValue: -6,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dotY, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(400 - delay), // Sync the loop
        ])
      );
    };

    const anim1 = animateDot(dot1Y, 0);
    const anim2 = animateDot(dot2Y, 100);
    const anim3 = animateDot(dot3Y, 200);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  return (
    <View style={styles.typingIndicator}>
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot1Y }] }]} />
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot2Y }] }]} />
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot3Y }] }]} />
    </View>
  );
});

// Smooth breathing cursor - more natural than blinking block
const StreamingCursor = memo(() => {
  const opacity = useRef(new Animated.Value(0.4)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const breatheAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    breatheAnim.start();
    return () => breatheAnim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.streamingCursor,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
});

// Custom smooth layout animation config
const smoothLayoutConfig = {
  duration: 150,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
  },
};

// Animated skeleton shimmer effect
const ImageSkeleton = memo(() => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.skeletonContainer}>
      <Animated.View style={[styles.skeletonShimmer, { opacity: shimmerOpacity }]}>
        <View style={styles.skeletonInner}>
          <Ionicons name="image-outline" size={32} color="rgba(155, 138, 255, 0.5)" />
          <Text style={styles.skeletonText}>Loading image...</Text>
        </View>
      </Animated.View>
    </View>
  );
});

// Image attachment with loading state
interface ImageAttachmentProps {
  attachment: Attachment;
  isGenerating?: boolean;
}

const ImageAttachment = memo<ImageAttachmentProps>(({ attachment, isGenerating }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleLoad = () => {
    setIsLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Show skeleton while generating or loading
  if (isGenerating) {
    return <ImageSkeleton />;
  }

  return (
    <View style={styles.imageWrapper}>
      {isLoading && !hasError && <ImageSkeleton />}
      {hasError ? (
        <View style={styles.imageError}>
          <Ionicons name="image-outline" size={32} color="#8E8EA0" />
          <Text style={styles.imageErrorText}>Failed to load image</Text>
        </View>
      ) : (
        <Animated.Image
          source={{ uri: attachment.uri }}
          style={[styles.attachmentImage, { opacity: fadeAnim }]}
          resizeMode="cover"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </View>
  );
});

export const MessageBubble = memo<MessageBubbleProps>(({ message, isLast }) => {
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isUser ? 20 : -20)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const prevContentLength = useRef(message.content?.length || 0);
  
  const { settings, speakMessage, voiceState, stopSpeaking, elevenLabsClient } = useChatStore();

  // Initial entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Smooth bubble growth during streaming
  useEffect(() => {
    if (message.isStreaming && message.content) {
      const currentLength = message.content.length;
      // Only animate if content actually changed
      if (currentLength > prevContentLength.current) {
        LayoutAnimation.configureNext(smoothLayoutConfig);
      }
      prevContentLength.current = currentLength;
    }
  }, [message.content, message.isStreaming]);

  // Subtle glow pulse while streaming
  useEffect(() => {
    if (message.isStreaming) {
      const pulseAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false, // backgroundColor can't use native driver
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
      pulseAnim.start();
      return () => pulseAnim.stop();
    } else {
      glowAnim.setValue(0);
    }
  }, [message.isStreaming]);

  // Interpolate glow color
  const bubbleGlow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#2D2D3A', '#363648'],
  });

  const handleCopy = async () => {
    await Clipboard.setStringAsync(message.content);
    if (settings.hapticFeedback) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSpeak = async () => {
    if (!elevenLabsClient) return;
    
    if (settings.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (voiceState.isSpeaking) {
      await stopSpeaking();
    } else {
      try {
        await speakMessage(message.content);
      } catch (error) {
        console.error('Failed to speak:', error);
      }
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Avatar */}
      <View style={[styles.avatar, isUser ? styles.userAvatar : styles.assistantAvatar]}>
        <Ionicons
          name={isUser ? 'person' : 'sparkles'}
          size={16}
          color={isUser ? '#10A37F' : '#9B8AFF'}
        />
      </View>

      {/* Message Content */}
      <Animated.View 
        style={[
          styles.bubble, 
          isUser ? styles.userBubble : styles.assistantBubble,
          !isUser && message.isStreaming && { backgroundColor: bubbleGlow },
        ]}
      >
        {/* Image Generation Skeleton - show when generating */}
        {message.isStreaming && message.content?.includes('Generating image') && (
          <View style={styles.attachmentsContainer}>
            <ImageSkeleton />
          </View>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            {message.attachments.map((attachment) => (
              attachment.type === 'image' ? (
                <ImageAttachment
                  key={attachment.id}
                  attachment={attachment}
                  isGenerating={false}
                />
              ) : (
                <View key={attachment.id} style={styles.attachmentFile}>
                  <Ionicons name="document" size={20} color="#8E8EA0" />
                  <Text style={styles.attachmentFileName} numberOfLines={1}>
                    {attachment.name}
                  </Text>
                </View>
              )
            ))}
          </View>
        )}

        {message.isStreaming && !message.content ? (
          <TypingDots />
        ) : (
          <View style={styles.messageContent}>
            {message.content ? (
              <Text style={[styles.messageText, isUser && styles.userMessageText]}>
                {message.content}
              </Text>
            ) : null}
            {message.isStreaming && <StreamingCursor />}
          </View>
        )}

        {/* Actions - only for assistant messages and not streaming */}
        {!isUser && !message.isStreaming && message.content && (
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleCopy} style={styles.actionButton}>
              <Ionicons name="copy-outline" size={16} color="#8E8EA0" />
            </TouchableOpacity>
            
            {elevenLabsClient && (
              <TouchableOpacity onPress={handleSpeak} style={styles.actionButton}>
                <Ionicons 
                  name={voiceState.isSpeaking ? 'stop-circle' : 'volume-high-outline'} 
                  size={16} 
                  color="#8E8EA0" 
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 8,
    paddingHorizontal: 16,
    maxWidth: '100%',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  userAvatar: {
    backgroundColor: 'rgba(16, 163, 127, 0.15)',
    marginLeft: 8,
    order: 1,
  },
  assistantAvatar: {
    backgroundColor: 'rgba(155, 138, 255, 0.15)',
    marginRight: 8,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  attachmentsContainer: {
    marginBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: -8,
    marginTop: -4,
  },
  imageWrapper: {
    width: 200,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#1A1A2E',
  },
  skeletonContainer: {
    width: 200,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#1A1A2E',
    overflow: 'hidden',
  },
  skeletonShimmer: {
    flex: 1,
    backgroundColor: '#252538',
  },
  skeletonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  skeletonText: {
    color: 'rgba(155, 138, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  imageError: {
    width: 200,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imageErrorText: {
    color: '#8E8EA0',
    fontSize: 12,
  },
  attachmentFile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(142, 142, 160, 0.1)',
    padding: 10,
    borderRadius: 8,
  },
  attachmentFileName: {
    color: '#ECECF1',
    fontSize: 12,
    marginLeft: 8,
    maxWidth: 150,
  },
  userBubble: {
    backgroundColor: '#10A37F',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#2D2D3A',
    borderBottomLeftRadius: 4,
  },
  messageContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#ECECF1',
    fontFamily: 'System',
    flexShrink: 1,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  streamingCursor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9B8AFF',
    marginLeft: 4,
    marginBottom: 6,
    shadowColor: '#9B8AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(142, 142, 160, 0.1)',
  },
  actionButton: {
    padding: 4,
    marginRight: 12,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9B8AFF',
  },
});

