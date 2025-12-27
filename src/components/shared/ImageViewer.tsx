/**
 * ImageViewer Component
 * Fullscreen image viewer with zoom and download functionality
 */

import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  ActivityIndicator,
  Platform,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import { GLASS_COLORS, GLASS_SHADOWS } from '../../theme/glassmorphism';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageViewerProps {
  visible: boolean;
  imageUri: string;
  imageName?: string;
  onClose: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  visible,
  imageUri,
  imageName = 'image.jpg',
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [saving, setSaving] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // Request media library permissions
      requestPermissions();
    } else {
      setScale(1);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const requestPermissions = async () => {
    if (Platform.OS === 'web') {
      setHasPermission(true); // Web doesn't need permissions
      return;
    }

    try {
      // Check permissions without requesting (don't request on viewer open, only when downloading)
      const { status } = await MediaLibrary.getPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error: any) {
      console.error('Failed to check permissions:', error);
      setHasPermission(false);
    }
  };

  const handleDownload = async () => {
    if (saving) return;

    try {
      setSaving(true);
      
      if (Platform.OS === 'web') {
        // For web, trigger download via link
        if (typeof document !== 'undefined') {
          const link = document.createElement('a');
          link.href = imageUri;
          link.download = imageName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        setSaving(false);
        return;
      }

      // For mobile, save to media library
      if (!hasPermission) {
        try {
          const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
          if (status !== 'granted') {
            const message = canAskAgain
              ? 'Please allow access to your photos to save images'
              : 'Please enable photo library access in Settings to save images';
            Alert.alert('Permission needed', message);
            setSaving(false);
            return;
          }
          setHasPermission(true);
        } catch (error: any) {
          console.error('Permission request error:', error);
          Alert.alert(
            'Permission error',
            'Unable to save image. You can still view images in fullscreen.'
          );
          setSaving(false);
          return;
        }
      }

      // Download image to local file system first
      const fileUri = FileSystem.documentDirectory + imageName;
      const downloadResult = await FileSystem.downloadAsync(imageUri, fileUri);

      // Save to media library
      await MediaLibrary.createAssetAsync(downloadResult.uri);
      
      // Clean up temporary file
      await FileSystem.deleteAsync(fileUri, { idempotent: true });

      if (Haptics.impactAsync) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert('Success', 'Image saved to your gallery');
    } catch (error: any) {
      console.error('Failed to save image:', error);
      Alert.alert('Error', `Failed to save image: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleDoubleTap = () => {
    const newScale = scale === 1 ? 2 : 1;
    setScale(newScale);
    if (Haptics.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        
        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.closeButtonInner}>
            <Ionicons name="close" size={24} color="#ECECF1" />
          </View>
        </TouchableOpacity>

        {/* Download Button */}
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleDownload}
          disabled={saving}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.downloadButtonInner}>
            {saving ? (
              <ActivityIndicator size="small" color="#ECECF1" />
            ) : (
              <Ionicons name="download-outline" size={24} color="#ECECF1" />
            )}
          </View>
        </TouchableOpacity>

        {/* Image Container */}
        <TouchableOpacity
          style={styles.imageContainer}
          activeOpacity={1}
          onPress={handleDoubleTap}
        >
          <Image
            source={{ uri: imageUri }}
            style={[
              styles.image,
              {
                transform: [{ scale }],
              },
            ]}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Image Name */}
        {imageName && (
          <View style={styles.imageNameContainer}>
            <Text style={styles.imageName} numberOfLines={1}>
              {imageName}
            </Text>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
  },
  closeButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GLASS_COLORS.neutral.medium,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.medium,
    justifyContent: 'center',
    alignItems: 'center',
    ...GLASS_SHADOWS.medium,
  },
  downloadButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
  },
  downloadButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GLASS_COLORS.accent.green.medium,
    borderWidth: 1,
    borderColor: GLASS_COLORS.accent.green.border.medium,
    justifyContent: 'center',
    alignItems: 'center',
    ...GLASS_SHADOWS.medium,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT - 200,
  },
  imageNameContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: GLASS_COLORS.background.medium,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.medium,
    borderRadius: 12,
    padding: 12,
    ...GLASS_SHADOWS.medium,
  },
  imageName: {
    color: '#ECECF1',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

