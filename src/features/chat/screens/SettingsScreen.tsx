/**
 * SettingsScreen Component
 * Settings modal for API keys, model selection, and preferences
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useRef, useState } from 'react';
import {
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GLASS_COLORS, GLASS_SHADOWS } from '../../../theme/glassmorphism';
import { useChatStore } from '../store/chatStore';
import { HealthProfileScreen } from '../../health/components/HealthProfileScreen';

interface SettingsScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ visible, onClose }) => {
  const { settings, updateSettings } = useChatStore();
  const insets = useSafeAreaInsets();
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [showElevenLabsKey, setShowElevenLabsKey] = useState(false);
  const [showHealthProfile, setShowHealthProfile] = useState(false);
  
  // Local state for API keys to avoid updating store on every keystroke
  // Use optional chaining and fallbacks to handle null/undefined settings
  const [localOpenRouterKey, setLocalOpenRouterKey] = useState(settings?.openRouterApiKey || '');
  const [localOpenAiKey, setLocalOpenAiKey] = useState(settings?.openAiApiKey || '');
  const [localElevenLabsKey, setLocalElevenLabsKey] = useState(settings?.elevenLabsApiKey || '');
  
  // Debounce timers
  const openRouterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openAiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elevenLabsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Sync local state when settings prop changes (e.g., from outside)
  // Only update if local state differs to avoid loops
  // Use optional chaining to prevent crashes if settings is null/undefined
  React.useEffect(() => {
    const apiKey = settings?.openRouterApiKey || '';
    if (localOpenRouterKey !== apiKey) {
      setLocalOpenRouterKey(apiKey);
    }
  }, [settings?.openRouterApiKey]);
  
  React.useEffect(() => {
    const apiKey = settings?.openAiApiKey || '';
    if (localOpenAiKey !== apiKey) {
      setLocalOpenAiKey(apiKey);
    }
  }, [settings?.openAiApiKey]);
  
  React.useEffect(() => {
    const apiKey = settings?.elevenLabsApiKey || '';
    if (localElevenLabsKey !== apiKey) {
      setLocalElevenLabsKey(apiKey);
    }
  }, [settings?.elevenLabsApiKey]);

  // Debounced handlers for API keys
  const handleOpenRouterKeyChange = useCallback((text: string) => {
    setLocalOpenRouterKey(text);
    
    // Clear existing timer
    if (openRouterTimerRef.current) {
      clearTimeout(openRouterTimerRef.current);
    }
    
    // Set new timer to update store after user stops typing (500ms)
    openRouterTimerRef.current = setTimeout(() => {
      updateSettings({ openRouterApiKey: text });
    }, 500);
  }, [updateSettings]);
  
  const handleOpenAiKeyChange = useCallback((text: string) => {
    setLocalOpenAiKey(text);
    
    if (openAiTimerRef.current) {
      clearTimeout(openAiTimerRef.current);
    }
    
    openAiTimerRef.current = setTimeout(() => {
      updateSettings({ openAiApiKey: text });
    }, 500);
  }, [updateSettings]);
  
  const handleElevenLabsKeyChange = useCallback((text: string) => {
    setLocalElevenLabsKey(text);
    
    if (elevenLabsTimerRef.current) {
      clearTimeout(elevenLabsTimerRef.current);
    }
    
    elevenLabsTimerRef.current = setTimeout(() => {
      updateSettings({ elevenLabsApiKey: text });
    }, 500);
  }, [updateSettings]);
  
  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      if (openRouterTimerRef.current) clearTimeout(openRouterTimerRef.current);
      if (openAiTimerRef.current) clearTimeout(openAiTimerRef.current);
      if (elevenLabsTimerRef.current) clearTimeout(elevenLabsTimerRef.current);
    };
  }, []);

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#1A1A2E', '#16162A', '#0F0F1E']}
          style={styles.gradient}
        >
          {Platform.OS !== 'web' && (
            <BlurView
              intensity={30}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          )}
          
          {/* Header */}
          <View style={[styles.header, { position: 'relative', zIndex: 1, paddingTop: Math.max(insets.top, 16) }]}>
            <Text style={styles.headerTitle}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#ECECF1" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={[styles.content, { position: 'relative', zIndex: 1 }]} 
            showsVerticalScrollIndicator={false}
          >
            {/* Health Profile Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="medical-outline" size={24} color="#3B82F6" />
                <Text style={styles.sectionTitle}>Health Profile</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Manage your health information for personalized medical consultations
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowHealthProfile(true)}
                activeOpacity={0.7}
              >
                <View style={styles.actionButtonLeft}>
                  <Ionicons name="medical-outline" size={20} color="#3B82F6" />
                  <Text style={styles.actionButtonText}>Manage Health Profile</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8E8EA0" />
              </TouchableOpacity>
            </View>

            {/* API Keys Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="key-outline" size={24} color="#9B8AFF" />
                <Text style={styles.sectionTitle}>API Keys</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Add your API keys to enable health consultation and voice features
              </Text>

              {/* OpenRouter API Key */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeader}>
                  <View style={styles.inputLabelContainer}>
                    <Ionicons name="sparkles" size={18} color="#9B8AFF" />
                    <Text style={styles.inputLabel}>OpenRouter API Key</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => openLink('https://openrouter.ai/keys')}
                    style={styles.linkButton}
                  >
                    <Text style={styles.linkText}>Get Key</Text>
                    <Ionicons name="open-outline" size={14} color="#10A37F" />
                  </TouchableOpacity>
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="sk-or-..."
                    placeholderTextColor="#5A5A6A"
                    value={localOpenRouterKey}
                    onChangeText={handleOpenRouterKeyChange}
                    secureTextEntry={!showOpenRouterKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowOpenRouterKey(!showOpenRouterKey)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showOpenRouterKey ? 'eye-off' : 'eye'}
                      size={20}
                      color="#8E8EA0"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* OpenAI API Key for Whisper */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeader}>
                  <View style={styles.inputLabelContainer}>
                    <Ionicons name="mic-outline" size={18} color="#10A37F" />
                    <Text style={styles.inputLabel}>OpenAI API Key</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => openLink('https://platform.openai.com/api-keys')}
                    style={styles.linkButton}
                  >
                    <Text style={styles.linkText}>Get Key</Text>
                    <Ionicons name="open-outline" size={14} color="#10A37F" />
                  </TouchableOpacity>
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="sk-..."
                    placeholderTextColor="#5A5A6A"
                    value={localOpenAiKey}
                    onChangeText={handleOpenAiKeyChange}
                    secureTextEntry={!showOpenAiKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowOpenAiKey(!showOpenAiKey)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showOpenAiKey ? 'eye-off' : 'eye'}
                      size={20}
                      color="#8E8EA0"
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.inputHint}>Required for voice transcription during health consultations</Text>
              </View>

              {/* ElevenLabs API Key */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeader}>
                  <View style={styles.inputLabelContainer}>
                    <Ionicons name="volume-high-outline" size={18} color="#9B8AFF" />
                    <Text style={styles.inputLabel}>ElevenLabs API Key</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => openLink('https://elevenlabs.io/app/settings/api-keys')}
                    style={styles.linkButton}
                  >
                    <Text style={styles.linkText}>Get Key</Text>
                    <Ionicons name="open-outline" size={14} color="#10A37F" />
                  </TouchableOpacity>
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Your ElevenLabs API key..."
                    placeholderTextColor="#5A5A6A"
                    value={localElevenLabsKey}
                    onChangeText={handleElevenLabsKeyChange}
                    secureTextEntry={!showElevenLabsKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowElevenLabsKey(!showElevenLabsKey)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showElevenLabsKey ? 'eye-off' : 'eye'}
                      size={20}
                      color="#8E8EA0"
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.inputHint}>Required for voice output during health consultations</Text>
              </View>
            </View>

            {/* Spacer for bottom padding */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </LinearGradient>
      </View>

      {/* Health Profile Modal */}
      <HealthProfileScreen
        visible={showHealthProfile}
        onClose={() => setShowHealthProfile(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1E',
  },
  gradient: {
    flex: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: GLASS_COLORS.border.subtle,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ECECF1',
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECECF1',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8EA0',
    marginBottom: 20,
    marginLeft: 34,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ECECF1',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: GLASS_COLORS.accent.green.light,
    borderWidth: 1,
    borderColor: GLASS_COLORS.accent.green.border.light,
  },
  linkText: {
    fontSize: 13,
    color: '#10A37F',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GLASS_COLORS.secondary.light,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.medium,
    ...GLASS_SHADOWS.subtle,
  },
  inputHint: {
    fontSize: 12,
    color: '#8E8EA0',
    marginTop: 8,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#ECECF1',
  },
  eyeButton: {
    padding: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: GLASS_COLORS.secondary.light,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.medium,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    ...GLASS_SHADOWS.subtle,
  },
  actionButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ECECF1',
  },
});

