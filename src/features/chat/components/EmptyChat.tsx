/**
 * EmptyChat Component
 * Displayed when no conversation is active or conversation is empty
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useChatStore } from '../store/chatStore';

const SUGGESTIONS = [
  {
    icon: 'medical-outline',
    title: 'Symptom question',
    prompt: 'I have a headache, what could cause it?',
  },
  {
    icon: 'flask-outline',
    title: 'Medication info',
    prompt: 'Tell me about common side effects of aspirin',
  },
  {
    icon: 'moon-outline',
    title: 'Wellness advice',
    prompt: 'What are some ways to improve sleep quality?',
  },
  {
    icon: 'heart-outline',
    title: 'Health condition',
    prompt: 'Explain what diabetes is in simple terms',
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
          colors={['#3B82F6', '#2563EB']}
          style={styles.logoGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="medical" size={40} color="#FFFFFF" />
        </LinearGradient>
      </View>

      {/* Title */}
      <Text style={styles.title}>How can I help with your health today?</Text>
      <Text style={styles.subtitle}>
        Ask about symptoms, medications, wellness, or general health questions
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
                <Ionicons name={suggestion.icon as any} size={20} color="#3B82F6" />
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
    shadowColor: '#3B82F6',
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

