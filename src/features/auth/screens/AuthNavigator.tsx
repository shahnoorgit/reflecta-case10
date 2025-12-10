/**
 * AuthNavigator
 * Handles navigation between login, signup, and forgot password screens
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, Alert } from 'react-native';
import { LoginScreen } from './LoginScreen';
import { SignupScreen } from './SignupScreen';
import { useAuthStore } from '../store/authStore';

type AuthScreen = 'login' | 'signup';

export const AuthNavigator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');
  const { resetPassword } = useAuthStore();

  const handleForgotPassword = () => {
    Alert.prompt(
      'Reset Password',
      'Enter your email address to receive a password reset link',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async (email) => {
            if (email) {
              const success = await resetPassword(email);
              if (success) {
                Alert.alert('Success', 'Check your email for the reset link');
              }
            }
          },
        },
      ],
      'plain-text',
      '',
      'email-address'
    );
  };

  return (
    <View style={styles.container}>
      {currentScreen === 'login' ? (
        <LoginScreen
          onSwitchToSignup={() => setCurrentScreen('signup')}
          onForgotPassword={handleForgotPassword}
        />
      ) : (
        <SignupScreen onSwitchToLogin={() => setCurrentScreen('login')} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AuthNavigator;

