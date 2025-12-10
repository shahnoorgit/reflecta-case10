/**
 * SettingsScreen Component
 * Settings modal for API keys, model selection, and preferences
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Switch,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useChatStore } from '../store/chatStore';
import { AVAILABLE_MODELS, DEFAULT_VOICES } from '../types';
import Slider from '@react-native-community/slider';

interface SettingsScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ visible, onClose }) => {
  const { settings, updateSettings } = useChatStore();
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [showElevenLabsKey, setShowElevenLabsKey] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    if (settings.hapticFeedback) {
      Haptics.selectionAsync();
    }
    updateSettings({ [key]: value });
  };

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const selectedModel = AVAILABLE_MODELS.find(m => m.id === settings.selectedModel);
  const selectedVoice = DEFAULT_VOICES.find(v => v.voice_id === settings.selectedVoice);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#1A1A2E', '#0F0F1E']}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#ECECF1" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* API Keys Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>API Keys</Text>
              <Text style={styles.sectionDescription}>
                Add your API keys to enable AI chat and voice features
              </Text>

              {/* OpenRouter API Key */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeader}>
                  <Text style={styles.inputLabel}>OpenRouter API Key</Text>
                  <TouchableOpacity
                    onPress={() => openLink('https://openrouter.ai/keys')}
                  >
                    <Text style={styles.linkText}>Get Key →</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="sk-or-..."
                    placeholderTextColor="#5A5A6A"
                    value={settings.openRouterApiKey}
                    onChangeText={(text) => handleSettingChange('openRouterApiKey', text)}
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
                  <Text style={styles.inputLabel}>OpenAI API Key (Voice Input)</Text>
                  <TouchableOpacity
                    onPress={() => openLink('https://platform.openai.com/api-keys')}
                  >
                    <Text style={styles.linkText}>Get Key →</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="sk-..."
                    placeholderTextColor="#5A5A6A"
                    value={settings.openAiApiKey}
                    onChangeText={(text) => handleSettingChange('openAiApiKey', text)}
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
                <Text style={styles.inputHint}>Required for voice transcription (Whisper)</Text>
              </View>

              {/* ElevenLabs API Key */}
              <View style={styles.inputGroup}>
                <View style={styles.inputHeader}>
                  <Text style={styles.inputLabel}>ElevenLabs API Key (Voice Output)</Text>
                  <TouchableOpacity
                    onPress={() => openLink('https://elevenlabs.io/app/settings/api-keys')}
                  >
                    <Text style={styles.linkText}>Get Key →</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Your ElevenLabs API key..."
                    placeholderTextColor="#5A5A6A"
                    value={settings.elevenLabsApiKey}
                    onChangeText={(text) => handleSettingChange('elevenLabsApiKey', text)}
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
              </View>
            </View>

            {/* Model Settings Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Model Settings</Text>

              {/* Temperature */}
              <View style={styles.sliderGroup}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.inputLabel}>Temperature</Text>
                  <Text style={styles.sliderValue}>{settings.temperature.toFixed(1)}</Text>
                </View>
                <Text style={styles.sliderDescription}>
                  Higher values make output more creative, lower values more focused
                </Text>
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={2}
                    value={settings.temperature}
                    onValueChange={(value) => handleSettingChange('temperature', value)}
                    minimumTrackTintColor="#10A37F"
                    maximumTrackTintColor="#3A3A4A"
                    thumbTintColor="#10A37F"
                  />
                </View>
              </View>

              {/* Max Tokens */}
              <View style={styles.sliderGroup}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.inputLabel}>Max Tokens</Text>
                  <Text style={styles.sliderValue}>{settings.maxTokens}</Text>
                </View>
                <Text style={styles.sliderDescription}>
                  Maximum length of the response
                </Text>
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={256}
                    maximumValue={8192}
                    step={256}
                    value={settings.maxTokens}
                    onValueChange={(value) => handleSettingChange('maxTokens', value)}
                    minimumTrackTintColor="#10A37F"
                    maximumTrackTintColor="#3A3A4A"
                    thumbTintColor="#10A37F"
                  />
                </View>
              </View>
            </View>

            {/* Voice Settings Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Voice Settings</Text>

              {/* Voice Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Voice</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.voiceList}
                >
                  {DEFAULT_VOICES.map((voice) => (
                    <TouchableOpacity
                      key={voice.voice_id}
                      style={[
                        styles.voiceChip,
                        voice.voice_id === settings.selectedVoice && styles.voiceChipSelected,
                      ]}
                      onPress={() => handleSettingChange('selectedVoice', voice.voice_id)}
                    >
                      <Text
                        style={[
                          styles.voiceChipText,
                          voice.voice_id === settings.selectedVoice && styles.voiceChipTextSelected,
                        ]}
                      >
                        {voice.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Preferences Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preferences</Text>

              {/* Haptic Feedback */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Ionicons name="phone-portrait-outline" size={20} color="#8E8EA0" />
                  <Text style={styles.toggleLabel}>Haptic Feedback</Text>
                </View>
                <Switch
                  value={settings.hapticFeedback}
                  onValueChange={(value) => handleSettingChange('hapticFeedback', value)}
                  trackColor={{ false: '#3A3A4A', true: 'rgba(16, 163, 127, 0.5)' }}
                  thumbColor={settings.hapticFeedback ? '#10A37F' : '#8E8EA0'}
                />
              </View>

              {/* Voice Enabled */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Ionicons name="volume-high-outline" size={20} color="#8E8EA0" />
                  <Text style={styles.toggleLabel}>Voice Mode</Text>
                </View>
                <Switch
                  value={settings.voiceEnabled}
                  onValueChange={(value) => handleSettingChange('voiceEnabled', value)}
                  trackColor={{ false: '#3A3A4A', true: 'rgba(16, 163, 127, 0.5)' }}
                  thumbColor={settings.voiceEnabled ? '#10A37F' : '#8E8EA0'}
                />
              </View>
            </View>

            {/* About Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <View style={styles.aboutCard}>
                <LinearGradient
                  colors={['rgba(155, 138, 255, 0.15)', 'rgba(107, 91, 255, 0.1)']}
                  style={styles.aboutGradient}
                >
                  <View style={styles.aboutIcon}>
                    <Ionicons name="sparkles" size={24} color="#9B8AFF" />
                  </View>
                  <Text style={styles.aboutTitle}>Reflecta Chat</Text>
                  <Text style={styles.aboutDescription}>
                    A ChatGPT-style app built with React Native, Expo, and OpenRouter
                  </Text>
                  <Text style={styles.aboutVersion}>Version 1.0.0</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Spacer for bottom padding */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </LinearGradient>
      </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 142, 160, 0.1)',
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
    backgroundColor: 'rgba(142, 142, 160, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECECF1',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8EA0',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ECECF1',
  },
  linkText: {
    fontSize: 13,
    color: '#10A37F',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2D3A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(142, 142, 160, 0.1)',
  },
  inputHint: {
    fontSize: 11,
    color: '#5A5A6A',
    marginTop: 6,
    marginLeft: 4,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#ECECF1',
  },
  eyeButton: {
    padding: 12,
  },
  sliderGroup: {
    marginBottom: 24,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sliderDescription: {
    fontSize: 12,
    color: '#5A5A6A',
    marginBottom: 12,
  },
  sliderValue: {
    fontSize: 14,
    color: '#10A37F',
    fontWeight: '600',
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  voiceList: {
    marginTop: 12,
  },
  voiceChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#2D2D3A',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(142, 142, 160, 0.1)',
  },
  voiceChipSelected: {
    backgroundColor: 'rgba(16, 163, 127, 0.15)',
    borderColor: '#10A37F',
  },
  voiceChipText: {
    fontSize: 14,
    color: '#8E8EA0',
    fontWeight: '500',
  },
  voiceChipTextSelected: {
    color: '#10A37F',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 142, 160, 0.05)',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 15,
    color: '#ECECF1',
    marginLeft: 12,
  },
  aboutCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  aboutGradient: {
    padding: 20,
    alignItems: 'center',
  },
  aboutIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(155, 138, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECECF1',
    marginBottom: 8,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#8E8EA0',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  aboutVersion: {
    fontSize: 12,
    color: '#5A5A6A',
  },
});

