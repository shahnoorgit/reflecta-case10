/**
 * EmptyChat Component
 * Displayed when no conversation is active or conversation is empty
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useChatStore } from '../store/chatStore';

const SUGGESTIONS = [
  {
    icon: 'bulb-outline',
    title: 'Explain a concept',
    prompt: 'Explain quantum computing in simple terms',
  },
  {
    icon: 'code-slash',
    title: 'Help me code',
    prompt: 'Write a function to sort an array in JavaScript',
  },
  {
    icon: 'create-outline',
    title: 'Write something',
    prompt: 'Write a professional email to request time off',
  },
  {
    icon: 'search-outline',
    title: 'Research a topic',
    prompt: 'What are the latest trends in AI?',
  },
];

export const EmptyChat: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  const { sendMessage, settings, createConversation } = useChatStore();

  useEffect(() => {
    // Small delay to ensure component is mounted
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSuggestionPress = async (prompt: string) => {
    if (settings.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    createConversation();
    await sendMessage(prompt);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Logo/Icon */}
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={['#9B8AFF', '#6B5BFF']}
          style={styles.logoGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="sparkles" size={40} color="#FFFFFF" />
        </LinearGradient>
      </View>

      {/* Title */}
      <Text style={styles.title}>How can I help you today?</Text>
      <Text style={styles.subtitle}>
        Start a conversation or try one of these suggestions
      </Text>

      {/* Suggestions Grid */}
      <View style={styles.suggestionsGrid}>
        {SUGGESTIONS.map((suggestion, index) => (
          <Animated.View
            key={suggestion.title}
            style={[
              styles.suggestionWrapper,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 30],
                      outputRange: [0, 30 + index * 10],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.suggestionCard}
              onPress={() => handleSuggestionPress(suggestion.prompt)}
              activeOpacity={0.7}
            >
              <View style={styles.suggestionIcon}>
                <Ionicons name={suggestion.icon as any} size={20} color="#9B8AFF" />
              </View>
              <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
              <Text style={styles.suggestionPrompt} numberOfLines={2}>
                {suggestion.prompt}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9B8AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ECECF1',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8EA0',
    textAlign: 'center',
    marginBottom: 32,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 400,
  },
  suggestionWrapper: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 12,
  },
  suggestionCard: {
    backgroundColor: 'rgba(45, 45, 58, 0.6)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(142, 142, 160, 0.1)',
    minHeight: 120,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(155, 138, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ECECF1',
    marginBottom: 4,
  },
  suggestionPrompt: {
    fontSize: 12,
    color: '#8E8EA0',
    lineHeight: 16,
  },
});

