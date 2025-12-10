/**
 * ConversationSidebar Component
 * Slide-out drawer showing conversation history
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useChatStore } from '../store/chatStore';
import { Conversation } from '../types';
import { useAuthStore } from '../../auth/store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.8;

interface ConversationSidebarProps {
  onSettingsPress: () => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  onSettingsPress,
}) => {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const {
    conversations,
    activeConversationId,
    isSidebarOpen,
    setSidebarOpen,
    setActiveConversation,
    createConversation,
    deleteConversation,
    settings,
  } = useChatStore();
  
  const { signOut, user } = useAuthStore();

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: isSidebarOpen ? 0 : -SIDEBAR_WIDTH,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: isSidebarOpen ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSidebarOpen]);

  const handleNewChat = () => {
    if (settings.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    createConversation();
  };

  const handleSelectConversation = (id: string) => {
    if (settings.hapticFeedback) {
      Haptics.selectionAsync();
    }
    setActiveConversation(id);
  };

  const handleDeleteConversation = (id: string) => {
    if (settings.hapticFeedback) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    deleteConversation(id);
  };

  const handleClose = () => {
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    if (settings.hapticFeedback) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    await signOut();
    setSidebarOpen(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Group conversations by date
  const groupedConversations = conversations.reduce((groups, conv) => {
    const dateKey = formatDate(conv.updatedAt);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(conv);
    return groups;
  }, {} as Record<string, Conversation[]>);

  return (
    <>
      {/* Backdrop - only render when sidebar is open */}
      {isSidebarOpen && (
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.backdropTouchable} />
          </TouchableWithoutFeedback>
        </Animated.View>
      )}

      {/* Sidebar - only render when open */}
      {isSidebarOpen && (
        <Animated.View
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
        <LinearGradient
          colors={['#1A1A2E', '#16162A']}
          style={styles.sidebarGradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleNewChat} style={styles.newChatButton}>
              <LinearGradient
                colors={['#10A37F', '#0D8A6A']}
                style={styles.newChatGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="add" size={22} color="#FFFFFF" />
                <Text style={styles.newChatText}>New Chat</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#8E8EA0" />
            </TouchableOpacity>
          </View>

          {/* Conversations List */}
          <ScrollView
            style={styles.conversationsList}
            showsVerticalScrollIndicator={false}
          >
            {Object.entries(groupedConversations).map(([dateKey, convs]) => (
              <View key={dateKey} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>{dateKey}</Text>
                {convs.map((conv) => (
                  <TouchableOpacity
                    key={conv.id}
                    style={[
                      styles.conversationItem,
                      conv.id === activeConversationId && styles.conversationItemActive,
                    ]}
                    onPress={() => handleSelectConversation(conv.id)}
                    onLongPress={() => handleDeleteConversation(conv.id)}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={18}
                      color={conv.id === activeConversationId ? '#10A37F' : '#8E8EA0'}
                    />
                    <Text
                      style={[
                        styles.conversationTitle,
                        conv.id === activeConversationId && styles.conversationTitleActive,
                      ]}
                      numberOfLines={1}
                    >
                      {conv.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteConversation(conv.id)}
                      style={styles.deleteButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#8E8EA0" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {conversations.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color="#3A3A4A" />
                <Text style={styles.emptyStateText}>No conversations yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Start a new chat to begin
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.footerButton}
              onPress={onSettingsPress}
            >
              <Ionicons name="settings-outline" size={22} color="#8E8EA0" />
              <Text style={styles.footerButtonText}>Settings</Text>
            </TouchableOpacity>
            {user && (
              <TouchableOpacity
                style={[styles.footerButton, styles.logoutButton]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={22} color="#F87171" />
                <Text style={[styles.footerButtonText, styles.logoutButtonText]}>Logout</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 100,
  },
  backdropTouchable: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    zIndex: 101,
  },
  sidebarGradient: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 142, 160, 0.1)',
  },
  newChatButton: {
    flex: 1,
    marginRight: 12,
  },
  newChatGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  newChatText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(142, 142, 160, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationsList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  dateGroup: {
    marginTop: 20,
  },
  dateHeader: {
    color: '#8E8EA0',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  conversationItemActive: {
    backgroundColor: 'rgba(16, 163, 127, 0.1)',
  },
  conversationTitle: {
    flex: 1,
    color: '#ECECF1',
    fontSize: 14,
    marginLeft: 12,
  },
  conversationTitleActive: {
    color: '#10A37F',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#8E8EA0',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: '#5A5A6A',
    fontSize: 14,
    marginTop: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(142, 142, 160, 0.1)',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  footerButtonText: {
    color: '#8E8EA0',
    fontSize: 14,
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#F87171',
  },
});

