/**
 * Health Profile Screen
 * Allows users to view and edit their health profile
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GLASS_COLORS, GLASS_SHADOWS } from '../../../theme/glassmorphism';
import { useHealthProfileStore } from '../store/healthProfileStore';

interface HealthProfileScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const HealthProfileScreen: React.FC<HealthProfileScreenProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const {
    profile,
    addSymptom,
    addCondition,
    addMedication,
    addAllergy,
    removeSymptom,
    removeCondition,
    removeMedication,
    removeAllergy,
    updateHealthProfile,
  } = useHealthProfileStore();

  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(profile.generalNotes);
  const [newItem, setNewItem] = useState('');
  const [activeSection, setActiveSection] = useState<'symptom' | 'condition' | 'medication' | 'allergy' | null>(null);

  const handleAddItem = async () => {
    if (!newItem.trim() || !activeSection) return;

    try {
      switch (activeSection) {
        case 'symptom':
          await addSymptom(newItem.trim());
          break;
        case 'condition':
          await addCondition(newItem.trim());
          break;
        case 'medication':
          await addMedication(newItem.trim());
          break;
        case 'allergy':
          await addAllergy(newItem.trim());
          break;
      }
      setNewItem('');
      setActiveSection(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleSaveNotes = async () => {
    await updateHealthProfile({ generalNotes: notes });
    setEditingNotes(false);
  };

  const renderSection = (
    title: string,
    icon: string,
    items: string[],
    onAdd: () => void,
    onRemove: (item: string) => void,
    sectionKey: 'symptom' | 'condition' | 'medication' | 'allergy'
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Ionicons name={icon as any} size={20} color="#9B8AFF" />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setActiveSection(sectionKey);
            setNewItem('');
          }}
        >
          <Ionicons name="add-circle-outline" size={24} color="#10A37F" />
        </TouchableOpacity>
      </View>

      {items.length > 0 ? (
        <View style={styles.itemsList}>
          {items.map((item, index) => (
            <View key={index} style={styles.item}>
              <Text style={styles.itemText}>{item}</Text>
              <TouchableOpacity
                onPress={() => onRemove(item)}
                style={styles.removeButton}
              >
                <Ionicons name="close-circle" size={20} color="#F87171" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No {title.toLowerCase()} added yet</Text>
      )}

      {activeSection === sectionKey && (
        <View style={styles.addItemContainer}>
          <TextInput
            style={styles.addItemInput}
            placeholder={`Add ${title.toLowerCase()}...`}
            placeholderTextColor="#8E8EA0"
            value={newItem}
            onChangeText={setNewItem}
            onSubmitEditing={handleAddItem}
            autoFocus
          />
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleAddItem}
          >
            <Ionicons name="checkmark" size={20} color="#10A37F" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setActiveSection(null);
              setNewItem('');
            }}
          >
            <Ionicons name="close" size={20} color="#8E8EA0" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {Platform.OS !== 'web' && (
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.header}>
          <Text style={styles.title}>Health Profile</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#ECECF1" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.description}>
            Your health information helps personalize your medical consultations. This information is stored locally and can be edited at any time.
          </Text>

          {renderSection(
            'Symptoms',
            'medical-outline',
            profile.symptoms,
            () => {},
            removeSymptom,
            'symptom'
          )}

          {renderSection(
            'Conditions',
            'clipboard-outline',
            profile.conditions,
            () => {},
            removeCondition,
            'condition'
          )}

          {renderSection(
            'Medications',
            'flask-outline',
            profile.medications,
            () => {},
            removeMedication,
            'medication'
          )}

          {renderSection(
            'Allergies',
            'warning-outline',
            profile.allergies,
            () => {},
            removeAllergy,
            'allergy'
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="document-text-outline" size={20} color="#9B8AFF" />
                <Text style={styles.sectionTitle}>General Notes</Text>
              </View>
              {!editingNotes && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setEditingNotes(true)}
                >
                  <Ionicons name="pencil-outline" size={20} color="#10A37F" />
                </TouchableOpacity>
              )}
            </View>

            {editingNotes ? (
              <View>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Add general health notes..."
                  placeholderTextColor="#8E8EA0"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
                <View style={styles.notesActions}>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveNotes}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelNotesButton}
                    onPress={() => {
                      setEditingNotes(false);
                      setNotes(profile.generalNotes);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={profile.generalNotes ? styles.notesText : styles.notesTextEmpty}>
                {profile.generalNotes || 'No notes added yet'}
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GLASS_COLORS.background.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: GLASS_COLORS.border.medium,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ECECF1',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GLASS_COLORS.neutral.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 14,
    color: '#8E8EA0',
    marginTop: 20,
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: GLASS_COLORS.secondary.light,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.medium,
    ...GLASS_SHADOWS.subtle,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ECECF1',
  },
  addButton: {
    padding: 4,
  },
  itemsList: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: GLASS_COLORS.neutral.medium,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.light,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    color: '#ECECF1',
  },
  removeButton: {
    padding: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8EA0',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: GLASS_COLORS.neutral.medium,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.medium,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#ECECF1',
  },
  confirmButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GLASS_COLORS.accent.green.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GLASS_COLORS.accent.green.border.light,
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GLASS_COLORS.neutral.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.medium,
  },
  notesInput: {
    backgroundColor: GLASS_COLORS.neutral.medium,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.medium,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#ECECF1',
    minHeight: 120,
  },
  notesText: {
    fontSize: 15,
    color: '#ECECF1',
    lineHeight: 22,
  },
  notesTextEmpty: {
    fontSize: 15,
    color: '#8E8EA0',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  notesActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: GLASS_COLORS.accent.green.medium,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GLASS_COLORS.accent.green.border.medium,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelNotesButton: {
    flex: 1,
    backgroundColor: GLASS_COLORS.neutral.medium,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.medium,
  },
  cancelButtonText: {
    color: '#8E8EA0',
    fontSize: 15,
    fontWeight: '600',
  },
});

