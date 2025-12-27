/**
 * ChatInput Component
 * Input field with voice recording, file upload, and send functionality
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Keyboard,
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
import { Attachment, AVAILABLE_MODELS } from '../types';

interface ChatInputProps {
  onVoiceModePress?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onVoiceModePress }) => {
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(44);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();
  
  const { sendMessage, isLoading, settings, updateSettings } = useChatStore();
  
  const selectedModel = AVAILABLE_MODELS.find(m => m.id === settings.selectedModel);
  
  const handleModelSelect = (modelId: string) => {
    if (settings.hapticFeedback) {
      Haptics.selectionAsync();
    }
    updateSettings({ selectedModel: modelId });
    setShowModelPicker(false);
  };

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 15);

  // Pick image from gallery
  const pickImage = async () => {
    setShowAttachMenu(false);
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets) {
      const newAttachments: Attachment[] = result.assets.map((asset) => ({
        id: generateId(),
        type: 'image',
        uri: asset.uri,
        name: asset.fileName || 'image.jpg',
        mimeType: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
        base64: asset.base64,
      }));
      
      setAttachments(prev => [...prev, ...newAttachments]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    setShowAttachMenu(false);
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const newAttachment: Attachment = {
        id: generateId(),
        type: 'image',
        uri: asset.uri,
        name: 'photo.jpg',
        mimeType: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
        base64: asset.base64,
      };
      
      setAttachments(prev => [...prev, newAttachment]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };


  // Remove attachment
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };


  const handleSend = async () => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;

    if (settings.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    const messageText = text.trim();
    const messageAttachments = [...attachments];
    
    setText('');
    setAttachments([]);
    setInputHeight(44);
    Keyboard.dismiss();

    await sendMessage(messageText, messageAttachments);
  };


  const handleContentSizeChange = (event: any) => {
    const { height } = event.nativeEvent.contentSize;
    setInputHeight(Math.min(Math.max(44, height), 120));
  };

  const hasText = text.trim().length > 0;
  const hasContent = hasText || attachments.length > 0;

  return (
    <>
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.floatingInputContainer}>
          {Platform.OS !== 'web' && (
            <BlurView
              intensity={30}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          )}
          <View style={styles.containerContent}>
          {/* Model Selector - Above input field */}
          <TouchableOpacity
            style={styles.modelSelector}
            onPress={() => setShowModelPicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="sparkles" size={14} color="#9B8AFF" />
            <Text style={styles.modelSelectorText} numberOfLines={1}>
              {selectedModel?.name || 'Select Model'}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#8E8EA0" />
          </TouchableOpacity>

          {/* Attachment Previews */}
          {attachments.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.attachmentPreview}
              contentContainerStyle={styles.attachmentPreviewContent}
            >
              {attachments.map((attachment) => (
                <View key={attachment.id} style={styles.attachmentItem}>
                  <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
                  <TouchableOpacity
                    style={styles.removeAttachment}
                    onPress={() => removeAttachment(attachment.id)}
                  >
                    <Ionicons name="close-circle" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.inputWrapper}>
        {/* Text Input */}
        <TextInput
          style={[
            styles.input,
            { height: inputHeight },
          ]}
          placeholder="Message"
          placeholderTextColor="#8E8EA0"
          value={text}
          onChangeText={setText}
          multiline
          onContentSizeChange={handleContentSizeChange}
          maxLength={4096}
          editable={!isLoading}
          returnKeyType="default"
        />

        {/* Right side buttons */}
        <View style={styles.rightButtons}>
          {/* Attachment Button */}
          <TouchableOpacity
            style={styles.attachButton}
            onPress={() => setShowAttachMenu(!showAttachMenu)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#8E8EA0" />
          </TouchableOpacity>

          {/* Voice Mode Button */}
          {onVoiceModePress && !hasContent && (
            <TouchableOpacity
              style={styles.voiceModeButton}
              onPress={onVoiceModePress}
            >
              <LinearGradient
                colors={['#9B8AFF', '#6B5BFF']}
                style={styles.voiceModeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="mic" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Send Button */}
          {hasContent && (
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={isLoading ? ['#4A4A5A', '#3A3A4A'] : ['#10A37F', '#0D8A6A']}
                  style={styles.sendButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isLoading ? (
                    <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />
                  ) : (
                    <Ionicons name="send" size={20} color="#FFFFFF" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
          </View>
          </View>

          {/* Attachment Menu */}
          {showAttachMenu && (
            <View style={styles.attachMenu}>
              <TouchableOpacity style={styles.attachMenuItem} onPress={takePhoto}>
                <View style={[styles.attachMenuIcon, { backgroundColor: GLASS_COLORS.accent.green.medium }]}>
                  <Ionicons name="camera-outline" size={24} color="#10A37F" />
                </View>
                <Text style={styles.attachMenuText}>Camera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.attachMenuItem} onPress={pickImage}>
                <View style={[styles.attachMenuIcon, { backgroundColor: GLASS_COLORS.purple.medium }]}>
                  <Ionicons name="image-outline" size={24} color="#9B8AFF" />
                </View>
                <Text style={styles.attachMenuText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
          </View>
        </View>
      </View>

      {/* Model Picker Modal */}
      <Modal
        visible={showModelPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModelPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowModelPicker(false)}
        >
          <View style={styles.modelPickerContainer}>
            <View style={styles.modelPickerHeader}>
              <Text style={styles.modelPickerTitle}>Select Model</Text>
              <TouchableOpacity
                onPress={() => setShowModelPicker(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#8E8EA0" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modelList}>
              {AVAILABLE_MODELS.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.modelItem,
                    model.id === settings.selectedModel && styles.modelItemSelected,
                  ]}
                  onPress={() => handleModelSelect(model.id)}
                >
                  <View style={styles.modelInfo}>
                    <View style={styles.modelNameRow}>
                      <Text style={styles.modelItemName}>{model.name}</Text>
                      <Text style={styles.modelProvider}>{model.provider}</Text>
                    </View>
                    <Text style={styles.modelDescription}>{model.description}</Text>
                  </View>
                  
                  {model.id === settings.selectedModel && (
                    <Ionicons name="checkmark-circle" size={24} color="#10A37F" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingTop: 4,
    backgroundColor: 'transparent',
  },
  floatingInputContainer: {
    marginHorizontal: 4,
    borderRadius: 28,
    backgroundColor: GLASS_COLORS.background.light,
    borderWidth: 1,
    borderColor: 'rgba(16, 163, 127, 0.25)',
    overflow: 'hidden',
    ...GLASS_SHADOWS.medium,
  },
  containerContent: {
    position: 'relative',
    zIndex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  modelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: GLASS_COLORS.purple.light,
    borderWidth: 1,
    borderColor: GLASS_COLORS.purple.border.light,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 8,
    gap: 6,
    ...GLASS_SHADOWS.subtle,
  },
  modelSelectorText: {
    color: '#ECECF1',
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 120,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: GLASS_COLORS.backdrop.medium,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modelPickerContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: GLASS_COLORS.background.medium,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.medium,
    borderRadius: 20,
    maxHeight: '70%',
    overflow: 'hidden',
    ...GLASS_SHADOWS.heavy,
  },
  modelPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: GLASS_COLORS.border.subtle,
  },
  modelPickerTitle: {
    color: '#ECECF1',
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  modelList: {
    padding: 12,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: GLASS_COLORS.neutral.medium,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.light,
  },
  modelItemSelected: {
    backgroundColor: GLASS_COLORS.accent.green.light,
    borderWidth: 1,
    borderColor: GLASS_COLORS.accent.green.border.medium,
  },
  modelInfo: {
    flex: 1,
    marginRight: 12,
  },
  modelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  modelItemName: {
    color: '#ECECF1',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  modelProvider: {
    color: '#8E8EA0',
    fontSize: 12,
    backgroundColor: 'rgba(142, 142, 160, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modelDescription: {
    color: '#8E8EA0',
    fontSize: 13,
  },
  attachmentPreview: {
    marginBottom: 12,
  },
  attachmentPreviewContent: {
    paddingRight: 8,
  },
  attachmentItem: {
    marginRight: 12,
    alignItems: 'center',
    position: 'relative',
  },
  attachmentImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#2D2D3A',
  },
  removeAttachment: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: GLASS_COLORS.secondary.light,
    borderWidth: 1,
    borderColor: 'rgba(16, 163, 127, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginTop: 8,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GLASS_COLORS.neutral.dark,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceModeButton: {
    marginLeft: 0,
  },
  voiceModeGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ECECF1',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    maxHeight: 120,
    textAlignVertical: 'center',
    minHeight: 36,
  },
  sendButton: {
    marginLeft: 0,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachMenu: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 20,
    paddingHorizontal: 32,
    backgroundColor: GLASS_COLORS.secondary.medium,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.medium,
    ...GLASS_SHADOWS.strong,
  },
  attachMenuItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  attachMenuIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.subtle,
  },
  attachMenuText: {
    color: '#ECECF1',
    fontSize: 13,
    fontWeight: '600',
  },
});

