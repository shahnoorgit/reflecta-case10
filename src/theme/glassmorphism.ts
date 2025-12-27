/**
 * Glassmorphism Theme Constants
 * Standardized opacity and styling values for consistent glassmorphism effects
 */

// Base colors
export const GLASS_COLORS = {
  // Primary background colors
  background: {
    light: 'rgba(26, 26, 46, 0.75)',      // Main glass backgrounds
    medium: 'rgba(26, 26, 46, 0.85)',     // Elevated glass (modals, sidebars)
    dark: 'rgba(26, 26, 46, 0.95)',       // Heavy glass overlays
    subtle: 'rgba(26, 26, 46, 0.6)',      // Light glass (input containers)
  },
  
  // Secondary backgrounds
  secondary: {
    light: 'rgba(45, 45, 58, 0.5)',      // Secondary glass elements
    medium: 'rgba(45, 45, 58, 0.6)',     // Medium secondary glass
    dark: 'rgba(45, 45, 58, 0.7)',       // Dark secondary glass
  },
  
  // Border colors - standardized opacity
  border: {
    subtle: 'rgba(142, 142, 160, 0.1)',   // Very subtle borders
    light: 'rgba(142, 142, 160, 0.15)',   // Standard borders
    medium: 'rgba(142, 142, 160, 0.2)',   // Medium borders
    strong: 'rgba(142, 142, 160, 0.25)',  // Strong borders
  },
  
  // Accent colors (green - user messages, actions)
  accent: {
    green: {
      light: 'rgba(16, 163, 127, 0.15)',   // Light accent backgrounds
      medium: 'rgba(16, 163, 127, 0.2)',   // Medium accent backgrounds
      strong: 'rgba(16, 163, 127, 0.25)',  // Strong accent backgrounds
      border: {
        light: 'rgba(16, 163, 127, 0.3)', // Light accent borders
        medium: 'rgba(16, 163, 127, 0.4)', // Medium accent borders
        strong: 'rgba(16, 163, 127, 0.5)', // Strong accent borders
      },
    },
  },
  
  // Medical blue accent (AI messages, highlights) - #3B82F6
  purple: {
    light: 'rgba(59, 130, 246, 0.15)',   // Light medical blue backgrounds
    medium: 'rgba(59, 130, 246, 0.2)',   // Medium medical blue backgrounds
    strong: 'rgba(59, 130, 246, 0.25)',   // Strong medical blue backgrounds
    border: {
      light: 'rgba(59, 130, 246, 0.25)', // Light medical blue borders
      medium: 'rgba(59, 130, 246, 0.3)', // Medium medical blue borders
      strong: 'rgba(59, 130, 246, 0.4)', // Strong medical blue borders
    },
  },
  
  // Neutral glass backgrounds
  neutral: {
    light: 'rgba(142, 142, 160, 0.05)',   // Very light neutral
    medium: 'rgba(142, 142, 160, 0.08)',  // Medium neutral
    dark: 'rgba(142, 142, 160, 0.1)',     // Dark neutral
  },
  
  // Backdrop/overlay colors
  backdrop: {
    light: 'rgba(0, 0, 0, 0.5)',          // Standard backdrop
    medium: 'rgba(0, 0, 0, 0.7)',         // Medium backdrop
    dark: 'rgba(0, 0, 0, 0.85)',          // Dark backdrop
  },
  
  // Error/alert colors
  error: {
    background: 'rgba(255, 68, 68, 0.85)',
    border: 'rgba(255, 68, 68, 0.4)',
  },
};

// Blur intensity levels (for expo-blur)
export const BLUR_INTENSITY = {
  light: 10,      // Subtle blur
  medium: 20,     // Standard blur
  strong: 30,     // Strong blur
  heavy: 40,      // Heavy blur
};

// Shadow configurations
export const GLASS_SHADOWS = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  heavy: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Standard glassmorphism style presets
export const GLASS_STYLES = {
  // Main container glass (chat input, headers)
  container: {
    backgroundColor: GLASS_COLORS.background.light,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.light,
  },
  
  // Modal/sidebar glass
  modal: {
    backgroundColor: GLASS_COLORS.background.medium,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.medium,
  },
  
  // Input field glass
  input: {
    backgroundColor: GLASS_COLORS.secondary.light,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.medium,
  },
  
  // Button glass
  button: {
    backgroundColor: GLASS_COLORS.neutral.light,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.light,
  },
  
  // User message bubble
  userBubble: {
    backgroundColor: GLASS_COLORS.accent.green.strong,
    borderWidth: 1,
    borderColor: GLASS_COLORS.accent.green.border.medium,
  },
  
  // Assistant message bubble
  assistantBubble: {
    backgroundColor: GLASS_COLORS.secondary.light,
    borderWidth: 1,
    borderColor: GLASS_COLORS.border.medium,
  },
  
  // Selected/active state
  active: {
    backgroundColor: GLASS_COLORS.accent.green.light,
    borderWidth: 1,
    borderColor: GLASS_COLORS.accent.green.border.light,
  },
};

