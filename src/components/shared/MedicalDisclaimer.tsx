/**
 * Medical Disclaimer Component
 * Shows disclaimer about medical advice and emergency situations
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GLASS_COLORS, GLASS_SHADOWS } from '../../theme/glassmorphism';

const DISCLAIMER_ACCEPTED_KEY = '@healthdoc_disclaimer_accepted';

interface MedicalDisclaimerProps {
  variant?: 'modal' | 'banner';
  onAccept?: () => void;
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({
  variant = 'modal',
  onAccept,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const insets = useSafeAreaInsets();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkDisclaimerStatus();
  }, []);

  const checkDisclaimerStatus = async () => {
    try {
      const accepted = await AsyncStorage.getItem(DISCLAIMER_ACCEPTED_KEY);
      if (!accepted) {
        if (variant === 'modal') {
          setShowModal(true);
        } else {
          setShowBanner(true);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      }
    } catch (error) {
      console.error('Failed to check disclaimer status:', error);
    }
  };

  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem(DISCLAIMER_ACCEPTED_KEY, 'true');
      if (variant === 'modal') {
        setShowModal(false);
      } else {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowBanner(false));
      }
      onAccept?.();
    } catch (error) {
      console.error('Failed to save disclaimer acceptance:', error);
    }
  };

  if (variant === 'banner' && !showBanner) {
    return null;
  }

  const disclaimerContent = (
    <>
      <View style={styles.header}>
        <Ionicons name="warning" size={24} color="#F87171" />
        <Text style={styles.title}>Medical Information Disclaimer</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.text}>
            This AI assistant provides general health information only and is not a substitute for professional medical advice, diagnosis, or treatment.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Important:</Text>
          <Text style={styles.text}>
            • Always consult qualified healthcare professionals for diagnosis and treatment{'\n'}
            • Never delay seeking professional medical advice because of information from this assistant{'\n'}
            • Do not use this assistant for medical emergencies
          </Text>
        </View>

        <View style={styles.emergencySection}>
          <Ionicons name="alert-circle" size={20} color="#F87171" />
          <Text style={styles.emergencyText}>
            For medical emergencies, call emergency services immediately.
          </Text>
        </View>
      </ScrollView>
    </>
  );

  if (variant === 'modal') {
    return (
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleAccept}
      >
        <View style={styles.modalContainer}>
          {Platform.OS !== 'web' && (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          )}
          <View style={[styles.modalContent, { marginTop: insets.top + 40, marginBottom: insets.bottom + 40 }]}>
            {disclaimerContent}
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
            >
              <Text style={styles.acceptButtonText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Banner variant
  return (
    <Animated.View
      style={[
        styles.banner,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              }),
            },
          ],
        },
      ]}
    >
      {Platform.OS !== 'web' && (
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      <View style={[styles.bannerContent, { position: 'relative', zIndex: 1 }]}>
        {collapsed ? (
          <TouchableOpacity
            style={styles.bannerCollapsed}
            onPress={() => setCollapsed(false)}
          >
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={styles.bannerText} numberOfLines={1}>
              Medical Information Disclaimer - Tap to view
            </Text>
            <Ionicons name="chevron-down" size={20} color="#8E8EA0" />
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.bannerHeader}
              onPress={() => setCollapsed(true)}
            >
              <Ionicons name="warning" size={18} color="#F87171" />
              <Text style={styles.bannerTitle}>Medical Information Disclaimer</Text>
              <Ionicons name="chevron-up" size={20} color="#8E8EA0" />
            </TouchableOpacity>
            <View style={styles.bannerBody}>
              <Text style={styles.bannerBodyText}>
                This AI assistant provides general health information only. Always consult qualified healthcare professionals for diagnosis and treatment. For emergencies, call emergency services immediately.
              </Text>
              <TouchableOpacity
                style={styles.bannerAcceptButton}
                onPress={handleAccept}
              >
                <Text style={styles.bannerAcceptButtonText}>I Understand</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: GLASS_COLORS.backdrop.dark,
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: GLASS_COLORS.background.medium,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.medium,
    borderRadius: 20,
    padding: 24,
    ...GLASS_SHADOWS.heavy,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ECECF1',
    flex: 1,
  },
  content: {
    maxHeight: 400,
  },
  section: {
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECECF1',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#8E8EA0',
    lineHeight: 22,
  },
  emergencySection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  emergencyText: {
    flex: 1,
    fontSize: 14,
    color: '#F87171',
    fontWeight: '600',
    lineHeight: 20,
  },
  acceptButton: {
    marginTop: 24,
    backgroundColor: GLASS_COLORS.accent.green.medium,
    borderWidth: 1,
    borderColor: GLASS_COLORS.accent.green.border.medium,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    ...GLASS_SHADOWS.medium,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: GLASS_COLORS.background.medium,
    borderBottomWidth: 1,
    borderBottomColor: GLASS_COLORS.border.medium,
    ...GLASS_SHADOWS.medium,
  },
  bannerContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  bannerTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#ECECF1',
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    color: '#8E8EA0',
  },
  bannerBody: {
    marginTop: 8,
  },
  bannerBodyText: {
    fontSize: 12,
    color: '#8E8EA0',
    lineHeight: 18,
    marginBottom: 12,
  },
  bannerAcceptButton: {
    alignSelf: 'flex-start',
    backgroundColor: GLASS_COLORS.accent.green.light,
    borderWidth: 1,
    borderColor: GLASS_COLORS.accent.green.border.light,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bannerAcceptButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10A37F',
  },
});

