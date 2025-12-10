/**
 * Root Layout
 * Configures navigation and theme for the ChatGPT Clone
 */

import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

// Custom dark theme matching ChatGPT-style design
const ChatDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0F0F1E',
    card: '#1A1A2E',
    text: '#ECECF1',
    border: 'rgba(142, 142, 160, 0.1)',
    primary: '#10A37F',
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <ThemeProvider value={ChatDarkTheme}>
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: '#0F0F1E' },
              animation: 'fade',
              animationDuration: 150,
              headerShown: false,
            }}
          >
            <Stack.Screen
              name="index"
              options={{
                contentStyle: { backgroundColor: '#0F0F1E' },
              }}
            />
          </Stack>
        </ThemeProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1E',
  },
});
