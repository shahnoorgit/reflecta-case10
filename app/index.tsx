/**
 * Main App Entry Point
 * ChatGPT Clone - Reflecta Chat
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ChatScreen, useChatStore } from '../src/features/chat';
import { AuthNavigator, useAuthStore } from '../src/features/auth';
import { isSupabaseConfigured } from '../src/lib/supabase';

export default function Index() {
  const { initializeClients, setUserId, syncWithCloud } = useChatStore();
  const { user, isInitialized, initialize } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Initialize auth and API clients on app start
    initialize();
    initializeClients();
  }, []);

  // Sync user ID to chat store when auth changes
  useEffect(() => {
    console.log('Auth state changed:', { userId: user?.id, email: user?.email });
    if (user?.id) {
      setUserId(user.id);
    } else {
      setUserId(null);
    }
  }, [user?.id]);

  // Check if we should show auth (only if Supabase is configured)
  useEffect(() => {
    if (isInitialized && isSupabaseConfigured() && !user) {
      setShowAuth(true);
    } else {
      setShowAuth(false);
    }
  }, [isInitialized, user]);

  // Show loading while initializing
  if (!isInitialized && isSupabaseConfigured()) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9B8AFF" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      {showAuth ? <AuthNavigator /> : <ChatScreen />}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F0F1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
