/**
 * Emergency Warning Component
 * Shows warning banner when emergency keywords are detected in user messages
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import { GLASS_COLORS, GLASS_SHADOWS } from '../../theme/glassmorphism';

const EMERGENCY_KEYWORDS = [
  'chest pain',
  'difficulty breathing',
  'shortness of breath',
  'can\'t breathe',
  'severe pain',
  'severe bleeding',
  'unconscious',
  'unresponsive',
  'heart attack',
  'stroke',
  'choking',
  'suicide',
  'killing myself',
  'emergency',
  'call 911',
  'call ambulance',
];

interface EmergencyWarningProps {
  message: string;
  onDismiss?: () => void;
}

export const EmergencyWarning: React.FC<EmergencyWarningProps> = ({
  message,
  onDismiss,
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const lowerMessage = message.toLowerCase();
    const hasEmergencyKeyword = EMERGENCY_KEYWORDS.some(keyword =>
      lowerMessage.includes(keyword.toLowerCase())
    );

    if (hasEmergencyKeyword) {
      setShowWarning(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      setShowWarning(false);
      slideAnim.setValue(-100);
      fadeAnim.setValue(0);
    }
  }, [message]);

  const handleCallEmergency = () => {
    Linking.openURL('tel:911');
  };

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowWarning(false);
      onDismiss?.();
    });
  };

  if (!showWarning) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {Platform.OS !== 'web' && (
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      <View style={[styles.content, { position: 'relative', zIndex: 1 }]}>
        <View style={styles.warningHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle" size={24} color="#F87171" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Medical Emergency Detected</Text>
            <Text style={styles.message}>
              For medical emergencies, please call emergency services immediately.
            </Text>
          </View>
          <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
            <Ionicons name="close" size={20} color="#ECECF1" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={handleCallEmergency}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={20} color="#FFFFFF" />
          <Text style={styles.emergencyButtonText}>Call Emergency Services</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderBottomWidth: 2,
    borderBottomColor: '#F87171',
    ...GLASS_SHADOWS.strong,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F87171',
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: '#ECECF1',
    lineHeight: 18,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F87171',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
    ...GLASS_SHADOWS.medium,
  },
  emergencyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

