/**
 * Settings Sync Service
 * Handles syncing user settings (API keys) with Supabase
 */

import { ChatSettings } from '../features/chat/types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

// Supabase user_settings table type
interface SupabaseUserSettings {
  user_id: string;
  open_router_api_key: string | null;
  openai_api_key: string | null;
  elevenlabs_api_key: string | null;
  selected_model: string | null;
  temperature: number | null;
  max_tokens: number | null;
  voice_enabled: boolean | null;
  selected_voice: string | null;
  haptic_feedback: boolean | null;
  updated_at: string;
}

/**
 * Fetch user settings from Supabase
 */
export const fetchSettingsFromCloud = async (
  userId: string
): Promise<Partial<ChatSettings> | null> => {
  if (!isSupabaseConfigured() || !userId) return null;

  try {
    console.log('Fetching settings from cloud for user:', userId);

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no settings found, that's okay - return null
      if (error.code === 'PGRST116') {
        console.log('No settings found in cloud');
        return null;
      }
      throw error;
    }

    if (!data) return null;

    // Map Supabase format to app format
    const settings: Partial<ChatSettings> = {
      openRouterApiKey: data.open_router_api_key || '',
      openAiApiKey: data.openai_api_key || '',
      elevenLabsApiKey: data.elevenlabs_api_key || '',
      selectedModel: data.selected_model || undefined,
      temperature: data.temperature ?? undefined,
      maxTokens: data.max_tokens ?? undefined,
      voiceEnabled: data.voice_enabled ?? undefined,
      selectedVoice: data.selected_voice || undefined,
      hapticFeedback: data.haptic_feedback ?? undefined,
    };

    console.log('✓ Fetched settings from cloud');
    return settings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
};

/**
 * Save user settings to Supabase
 */
export const saveSettingsToCloud = async (
  userId: string,
  settings: Partial<ChatSettings>
): Promise<boolean> => {
  if (!isSupabaseConfigured() || !userId) return false;

  try {
    console.log('Saving settings to cloud for user:', userId);

    // Map app format to Supabase format
    const supabaseSettings: Partial<SupabaseUserSettings> = {
      user_id: userId,
      open_router_api_key: settings.openRouterApiKey || null,
      openai_api_key: settings.openAiApiKey || null,
      elevenlabs_api_key: settings.elevenLabsApiKey || null,
      selected_model: settings.selectedModel || null,
      temperature: settings.temperature ?? null,
      max_tokens: settings.maxTokens ?? null,
      voice_enabled: settings.voiceEnabled ?? null,
      selected_voice: settings.selectedVoice || null,
      haptic_feedback: settings.hapticFeedback ?? null,
      updated_at: new Date().toISOString(),
    };

    // Use upsert to create or update
    const { error } = await supabase
      .from('user_settings')
      .upsert(supabaseSettings, {
        onConflict: 'user_id',
      });

    if (error) throw error;

    console.log('✓ Settings saved to cloud');
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

/**
 * Merge local and cloud settings
 * Cloud settings take precedence for API keys if local is empty
 */
export const mergeSettings = (
  localSettings: ChatSettings,
  cloudSettings: Partial<ChatSettings> | null
): ChatSettings => {
  if (!cloudSettings) return localSettings;

  // Merge: use cloud value if local is empty, otherwise keep local
  return {
    ...localSettings,
    openRouterApiKey: localSettings.openRouterApiKey || cloudSettings.openRouterApiKey || '',
    openAiApiKey: localSettings.openAiApiKey || cloudSettings.openAiApiKey || '',
    elevenLabsApiKey: localSettings.elevenLabsApiKey || cloudSettings.elevenLabsApiKey || '',
    // For other settings, prefer cloud if provided
    selectedModel: cloudSettings.selectedModel || localSettings.selectedModel,
    temperature: cloudSettings.temperature ?? localSettings.temperature,
    maxTokens: cloudSettings.maxTokens ?? localSettings.maxTokens,
    voiceEnabled: cloudSettings.voiceEnabled ?? localSettings.voiceEnabled,
    selectedVoice: cloudSettings.selectedVoice || localSettings.selectedVoice,
    hapticFeedback: cloudSettings.hapticFeedback ?? localSettings.hapticFeedback,
  };
};

