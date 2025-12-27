/**
 * ConversationSidebar Component
 * Slide-out drawer showing conversation history
 */

import React, { useRef, useEffect, memo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
  Easing,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GLASS_COLORS, GLASS_SHADOWS } from '../../../theme/glassmorphism';
import { useChatStore } from '../store/chatStore';
import { Conversation, Message } from '../types';
import { useAuthStore } from '../../auth/store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.8;

interface ConversationSidebarProps {
  onSettingsPress: () => void;
}

// Conversation Skeleton Loader Component
const ConversationSkeleton = memo(() => {
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
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.skeletonItem}>
          <Animated.View
            style={[
              styles.skeletonIcon,
              { opacity: shimmerOpacity },
            ]}
          />
          <View style={styles.skeletonTextContainer}>
            <Animated.View
              style={[
                styles.skeletonText,
                { 
                  width: i % 2 === 0 ? '70%' : '85%',
                  opacity: shimmerOpacity,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
});

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  onSettingsPress,
}) => {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const {
    conversations,
    activeConversationId,
    isSidebarOpen,
    setSidebarOpen,
    setActiveConversation,
    createConversation,
    deleteConversation,
    settings,
    isSyncing,
    conversationsHasMore,
    fetchMoreConversations,
  } = useChatStore();
  
  const { signOut, user } = useAuthStore();

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: isSidebarOpen ? 0 : -SIDEBAR_WIDTH,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: isSidebarOpen ? 1 : 0,
        duration: 500,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Material Design easing
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

  // Handle scroll for pagination
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 200; // Trigger when 200px from bottom
    
    // Check if user scrolled near the bottom
    if (
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom &&
      conversationsHasMore &&
      !isSyncing
    ) {
      // Prefetch more conversations
      fetchMoreConversations();
    }
  }, [conversationsHasMore, isSyncing, fetchMoreConversations]);

  // Search messages across all conversations (like ChatGPT)
  interface SearchResult {
    message: Message;
    conversation: Conversation;
    matchIndex: number; // Index of the match in the message content
  }

  const searchResults: SearchResult[] = searchQuery.trim()
    ? conversations
        .flatMap((conv) =>
          conv.messages
            .map((msg, msgIndex) => ({
              message: msg,
              conversation: conv,
              matchIndex: msg.content.toLowerCase().indexOf(searchQuery.toLowerCase()),
            }))
            .filter((result) => result.matchIndex !== -1)
        )
        .sort((a, b) => b.message.timestamp - a.message.timestamp) // Sort by most recent first
        .slice(0, 50) // Limit to 50 results
    : [];

  // Group conversations by date (only when not searching)
  const groupedConversations = searchQuery.trim()
    ? {}
    : conversations.reduce((groups, conv) => {
        const dateKey = formatDate(conv.updatedAt);
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(conv);
        return groups;
      }, {} as Record<string, Conversation[]>);

  // Get preview text around the match
  const getMessagePreview = (content: string, matchIndex: number, queryLength: number): string => {
    const PREVIEW_LENGTH = 80;
    const start = Math.max(0, matchIndex - PREVIEW_LENGTH);
    const end = Math.min(content.length, matchIndex + queryLength + PREVIEW_LENGTH);
    let preview = content.substring(start, end);
    
    if (start > 0) preview = '...' + preview;
    if (end < content.length) preview = preview + '...';
    
    return preview;
  };

  // Clear search when sidebar closes
  useEffect(() => {
    if (!isSidebarOpen) {
      setSearchQuery('');
      setIsSearchFocused(false);
    }
  }, [isSidebarOpen]);


  return (
    <>
      {/* Backdrop - always rendered, animated */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: fadeAnim,
            pointerEvents: isSidebarOpen ? 'auto' : 'none',
          },
        ]}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Sidebar - always rendered, animated */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
            pointerEvents: isSidebarOpen ? 'auto' : 'none',
          },
        ]}
      >
        <LinearGradient
          colors={['#1A1A2E', '#16162A']}
          style={styles.sidebarGradient}
        >
          {Platform.OS !== 'web' && (
            <BlurView
              intensity={30}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          )}
          <View style={{ position: 'relative', zIndex: 1, flex: 1 }}>
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

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchInputWrapper,
                isSearchFocused && styles.searchInputWrapperFocused,
              ]}
            >
              <Ionicons
                name="search"
                size={18}
                          color={isSearchFocused ? '#3B82F6' : '#8E8EA0'}
                style={styles.searchIcon}
              />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search conversations..."
                placeholderTextColor="#5A5A6A"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  style={styles.clearSearchButton}
                >
                  <Ionicons name="close-circle" size={18} color="#8E8EA0" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Conversations List / Search Results */}
          <ScrollView
            style={styles.conversationsList}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={400}
          >
            {isSyncing && conversations.length === 0 ? (
              <ConversationSkeleton />
            ) : (
              <>
                {searchQuery.trim() ? (
                  // Show search results (message-based)
                  <View>
                    <View style={styles.searchResultsHeader}>
                      <Text style={styles.searchResultsCount}>
                        {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
                      </Text>
                    </View>
                    {searchResults.map((result, index) => {
                      const preview = getMessagePreview(
                        result.message.content,
                        result.matchIndex,
                        searchQuery.length
                      );
                      const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                      const previewParts = preview.split(new RegExp(`(${escapedQuery})`, 'gi'));
                      const queryLower = searchQuery.toLowerCase();

                      return (
                        <TouchableOpacity
                          key={`${result.conversation.id}-${result.message.id}-${index}`}
                          style={[
                            styles.searchResultItem,
                            result.conversation.id === activeConversationId && styles.searchResultItemActive,
                          ]}
                          onPress={() => handleSelectConversation(result.conversation.id)}
                        >
                          <View style={styles.searchResultHeader}>
                            <Ionicons
                              name={result.message.role === 'user' ? 'person' : 'sparkles'}
                              size={14}
                                    color={result.message.role === 'user' ? '#10A37F' : '#3B82F6'}
                              style={styles.searchResultIcon}
                            />
                            <Text style={styles.searchResultConversationTitle} numberOfLines={1}>
                              {result.conversation.title}
                            </Text>
                          </View>
                          <Text style={styles.searchResultPreview} numberOfLines={2}>
                            {previewParts.map((part, partIndex) => {
                              if (part.toLowerCase() === queryLower && part.length > 0) {
                                return (
                                  <Text key={partIndex} style={styles.searchResultHighlight}>
                                    {part}
                                  </Text>
                                );
                              }
                              return <Text key={partIndex}>{part}</Text>;
                            })}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  // Show normal conversation list grouped by date
                  Object.entries(groupedConversations).map(([dateKey, convs]) => (
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
                  ))
                )}

                {((searchQuery.trim() && searchResults.length === 0) || (!searchQuery.trim() && conversations.length === 0)) && !isSyncing && (
                  <View style={styles.emptyState}>
                    <Ionicons 
                      name={searchQuery.trim() ? "search-outline" : "chatbubbles-outline"} 
                      size={48} 
                      color="#3A3A4A" 
                    />
                    <Text style={styles.emptyStateText}>
                      {searchQuery.trim() ? 'No messages found' : 'No conversations yet'}
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      {searchQuery.trim() 
                        ? `No messages match "${searchQuery}"` 
                        : 'Start a new chat to begin'}
                    </Text>
                    {searchQuery.trim() && (
                      <TouchableOpacity
                        onPress={() => setSearchQuery('')}
                        style={styles.clearSearchButtonText}
                      >
                        <Text style={styles.clearSearchText}>Clear search</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                
                {/* Loading indicator when fetching more */}
                {isSyncing && conversations.length > 0 && (
                  <View style={styles.loadingMore}>
                    <Text style={styles.loadingMoreText}>Loading more...</Text>
                  </View>
                )}
              </>
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
          </View>
        </LinearGradient>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GLASS_COLORS.backdrop.light,
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
    backgroundColor: GLASS_COLORS.background.medium,
    borderRightWidth: 1,
    borderRightColor: GLASS_COLORS.border.light,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: GLASS_COLORS.border.light,
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
    backgroundColor: GLASS_COLORS.neutral.medium,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.medium,
    justifyContent: 'center',
    alignItems: 'center',
    ...GLASS_SHADOWS.subtle,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: GLASS_COLORS.border.light,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GLASS_COLORS.secondary.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.medium,
    paddingHorizontal: 12,
    ...GLASS_SHADOWS.subtle,
  },
  searchInputWrapperFocused: {
    borderColor: '#3B82F6',
    backgroundColor: GLASS_COLORS.purple.light,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#ECECF1',
    fontSize: 14,
    paddingVertical: 0,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 4,
  },
  clearSearchButtonText: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearSearchText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  searchResultsHeader: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: GLASS_COLORS.border.subtle,
    marginBottom: 8,
  },
  searchResultsCount: {
    color: '#8E8EA0',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  searchResultItem: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: GLASS_COLORS.neutral.light,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.subtle,
  },
  searchResultItemActive: {
    backgroundColor: GLASS_COLORS.accent.green.light,
    borderColor: GLASS_COLORS.accent.green.border.light,
  },
  searchResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  searchResultIcon: {
    marginRight: 6,
  },
  searchResultConversationTitle: {
    flex: 1,
    color: '#ECECF1',
    fontSize: 13,
    fontWeight: '600',
  },
  searchResultPreview: {
    color: '#8E8EA0',
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 20,
  },
  searchResultHighlight: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    fontWeight: '600',
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
    backgroundColor: GLASS_COLORS.neutral.light,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.subtle,
  },
  conversationItemActive: {
    backgroundColor: GLASS_COLORS.accent.green.light,
    borderColor: GLASS_COLORS.accent.green.border.light,
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
    borderTopColor: GLASS_COLORS.border.light,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: GLASS_COLORS.neutral.light,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.subtle,
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
  skeletonContainer: {
    paddingHorizontal: 12,
    paddingTop: 20,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  skeletonIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: GLASS_COLORS.neutral.medium,
    marginRight: 12,
  },
  skeletonTextContainer: {
    flex: 1,
  },
  skeletonText: {
    height: 14,
    borderRadius: 7,
    backgroundColor: GLASS_COLORS.neutral.medium,
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingMoreText: {
    color: '#8E8EA0',
    fontSize: 12,
  },
});

