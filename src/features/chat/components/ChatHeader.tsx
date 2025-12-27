/**
 * ChatHeader Component
 * Header with menu, title, and model selector
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GLASS_COLORS, GLASS_SHADOWS } from '../../../theme/glassmorphism';
import { useChatStore } from '../store/chatStore';

interface ChatHeaderProps {
  onMenuPress: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onMenuPress }) => {
  const { 
    getActiveConversation, 
    settings,
    createConversation,
  } = useChatStore();

  const activeConversation = getActiveConversation();

  const handleNewChat = () => {
    if (settings.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    createConversation();
  };


  return (
    <View style={styles.container}>
      {/* Floating Header */}
      <View style={styles.floatingHeader}>
        <LinearGradient
          colors={['rgba(26, 26, 46, 0.95)', 'rgba(22, 22, 42, 0.95)']}
          style={styles.gradient}
        >
          {Platform.OS !== 'web' && (
            <BlurView
              intensity={40}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          )}
          <View style={[styles.content, { position: 'relative', zIndex: 1 }]}>
            {/* Menu Button */}
            <TouchableOpacity 
              onPress={onMenuPress} 
              style={styles.menuButton}
              activeOpacity={0.7}
            >
              <View style={styles.menuButtonInner}>
                <Ionicons name="menu" size={22} color="#ECECF1" />
              </View>
            </TouchableOpacity>

            {/* Center - Title */}
            <View style={styles.centerContent}>
              {activeConversation && (
                <View style={styles.titleContainer}>
                  <Text style={styles.conversationTitle} numberOfLines={1}>
                    {activeConversation.title}
                  </Text>
                </View>
              )}
            </View>

            {/* New Chat Button */}
            <TouchableOpacity 
              onPress={handleNewChat} 
              style={styles.newChatButton}
              activeOpacity={0.7}
            >
              <View style={styles.newChatButtonInner}>
                <Ionicons name="add" size={22} color="#ECECF1" />
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
    paddingTop: 50,
    paddingBottom: 8,
  },
  floatingHeader: {
    marginHorizontal: 12,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(155, 138, 255, 0.2)',
    ...GLASS_SHADOWS.strong,
  },
  gradient: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GLASS_COLORS.neutral.medium,
    borderWidth: 1,
    borderColor: 'rgba(142, 142, 160, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    ...GLASS_SHADOWS.subtle,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 142, 160, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(155, 138, 255, 0.2)',
    maxWidth: '90%',
  },
  conversationTitle: {
    color: '#ECECF1',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GLASS_COLORS.neutral.medium,
    borderWidth: 1,
    borderColor: 'rgba(142, 142, 160, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    ...GLASS_SHADOWS.subtle,
  },
});

