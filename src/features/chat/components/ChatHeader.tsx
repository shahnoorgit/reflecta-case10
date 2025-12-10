/**
 * ChatHeader Component
 * Header with menu, title, and model selector
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuthStore } from '../../auth/store/authStore';
import { useChatStore } from '../store/chatStore';
import { AVAILABLE_MODELS } from '../types';

interface ChatHeaderProps {
  onMenuPress: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onMenuPress }) => {
  const [showModelPicker, setShowModelPicker] = useState(false);
  
  const { 
    getActiveConversation, 
    settings, 
    updateSettings,
    createConversation,
  } = useChatStore();

  const { user, signOut } = useAuthStore();

  const activeConversation = getActiveConversation();
  const selectedModel = AVAILABLE_MODELS.find(m => m.id === settings.selectedModel);

  const handleModelSelect = (modelId: string) => {
    if (settings.hapticFeedback) {
      Haptics.selectionAsync();
    }
    updateSettings({ selectedModel: modelId });
    setShowModelPicker(false);
  };

  const handleNewChat = () => {
    if (settings.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    createConversation();
  };


  return (
    <>
      <View style={styles.container}>
        <LinearGradient
          colors={['#1A1A2E', '#16162A']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            {/* Menu Button */}
            <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
              <Ionicons name="menu" size={24} color="#ECECF1" />
            </TouchableOpacity>

            {/* Center - Title and Model Selector */}
            <View style={styles.centerContent}>
              <TouchableOpacity
                style={styles.modelSelector}
                onPress={() => setShowModelPicker(true)}
              >
                <Text style={styles.modelName} numberOfLines={1}>
                  {selectedModel?.name || 'Select Model'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#8E8EA0" />
              </TouchableOpacity>
              
              {activeConversation && (
                <Text style={styles.conversationTitle} numberOfLines={1}>
                  {activeConversation.title}
                </Text>
              )}
            </View>

            {/* New Chat Button */}
            <TouchableOpacity onPress={handleNewChat} style={styles.newChatButton}>
              <Ionicons name="create-outline" size={24} color="#ECECF1" />
            </TouchableOpacity>

            
          </View>
        </LinearGradient>
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
    zIndex: 10,
  },
  gradient: {
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 142, 160, 0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(142, 142, 160, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  modelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(142, 142, 160, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  modelName: {
    color: '#ECECF1',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  conversationTitle: {
    color: '#8E8EA0',
    fontSize: 12,
    marginTop: 4,
    maxWidth: 200,
  },
  newChatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(142, 142, 160, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modelPickerContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modelPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 142, 160, 0.1)',
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
    backgroundColor: 'rgba(142, 142, 160, 0.05)',
  },
  modelItemSelected: {
    backgroundColor: 'rgba(16, 163, 127, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 163, 127, 0.3)',
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
});

