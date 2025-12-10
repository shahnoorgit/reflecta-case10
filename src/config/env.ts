/**
 * Type-Safe Environment Configuration
 * 
 * For Expo/React Native, use process.env.EXPO_PUBLIC_* variables.
 * Add your keys to a .env file with EXPO_PUBLIC_ prefix.
 */

/**
 * Environment variables (from .env file)
 * Must be prefixed with EXPO_PUBLIC_ in Expo
 */
export const env = {
  // Supabase
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // API Keys
  OPENROUTER_API_KEY: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '',
  OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
  DEEPSEEK_API_KEY: process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY || '',
  ELEVENLABS_API_KEY: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '',
} as const;

/**
 * Supabase configuration
 */
export const supabaseConfig = {
  url: env.SUPABASE_URL,
  anonKey: env.SUPABASE_ANON_KEY,
} as const;

/**
 * Clean API keys helper
 */
export const apiKeys = {
  openRouter: env.OPENROUTER_API_KEY,
  openAi: env.OPENAI_API_KEY,
  deepseek: env.DEEPSEEK_API_KEY,
  elevenLabs: env.ELEVENLABS_API_KEY,
} as const;

/**
 * Check if a key is configured
 */
export const hasApiKey = (key: keyof typeof apiKeys): boolean => {
  return Boolean(apiKeys[key] && apiKeys[key].length > 0);
};

export default env;

