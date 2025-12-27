/**
 * Health Profile Store
 * Manages user's health profile including symptoms, conditions, medications, and allergies
 * Persists to AsyncStorage and syncs with Supabase
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

export interface HealthProfile {
  symptoms: string[];
  conditions: string[];
  medications: string[];
  allergies: string[];
  generalNotes: string;
  lastUpdated: number;
}

interface HealthProfileState {
  profile: HealthProfile;
  userId: string | null;
  
  // Actions
  setUserId: (userId: string | null) => void;
  updateHealthProfile: (updates: Partial<HealthProfile>) => Promise<void>;
  addSymptom: (symptom: string) => Promise<void>;
  addCondition: (condition: string) => Promise<void>;
  addMedication: (medication: string) => Promise<void>;
  addAllergy: (allergy: string) => Promise<void>;
  removeSymptom: (symptom: string) => Promise<void>;
  removeCondition: (condition: string) => Promise<void>;
  removeMedication: (medication: string) => Promise<void>;
  removeAllergy: (allergy: string) => Promise<void>;
  getHealthContext: () => string;
  clearProfile: () => Promise<void>;
}

const DEFAULT_PROFILE: HealthProfile = {
  symptoms: [],
  conditions: [],
  medications: [],
  allergies: [],
  generalNotes: '',
  lastUpdated: Date.now(),
};

export const useHealthProfileStore = create<HealthProfileState>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      userId: null,

      setUserId: (userId: string | null) => {
        set({ userId });
      },

      updateHealthProfile: async (updates: Partial<HealthProfile>) => {
        const currentProfile = get().profile;
        const updatedProfile: HealthProfile = {
          ...currentProfile,
          ...updates,
          lastUpdated: Date.now(),
        };
        
        set({ profile: updatedProfile });

        // Sync to Supabase if user is logged in
        const { userId } = get();
        if (userId && isSupabaseConfigured()) {
          try {
            await supabase
              .from('health_profiles')
              .upsert({
                user_id: userId,
                profile: updatedProfile,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id',
              });
          } catch (error) {
            console.error('Failed to sync health profile:', error);
          }
        }
      },

      addSymptom: async (symptom: string) => {
        const { profile } = get();
        const normalized = symptom.trim().toLowerCase();
        
        // Avoid duplicates
        if (profile.symptoms.some(s => s.toLowerCase() === normalized)) {
          return;
        }

        await get().updateHealthProfile({
          symptoms: [...profile.symptoms, symptom.trim()],
        });
      },

      addCondition: async (condition: string) => {
        const { profile } = get();
        const normalized = condition.trim().toLowerCase();
        
        if (profile.conditions.some(c => c.toLowerCase() === normalized)) {
          return;
        }

        await get().updateHealthProfile({
          conditions: [...profile.conditions, condition.trim()],
        });
      },

      addMedication: async (medication: string) => {
        const { profile } = get();
        const normalized = medication.trim().toLowerCase();
        
        if (profile.medications.some(m => m.toLowerCase() === normalized)) {
          return;
        }

        await get().updateHealthProfile({
          medications: [...profile.medications, medication.trim()],
        });
      },

      addAllergy: async (allergy: string) => {
        const { profile } = get();
        const normalized = allergy.trim().toLowerCase();
        
        if (profile.allergies.some(a => a.toLowerCase() === normalized)) {
          return;
        }

        await get().updateHealthProfile({
          allergies: [...profile.allergies, allergy.trim()],
        });
      },

      removeSymptom: async (symptom: string) => {
        const { profile } = get();
        await get().updateHealthProfile({
          symptoms: profile.symptoms.filter(s => s !== symptom),
        });
      },

      removeCondition: async (condition: string) => {
        const { profile } = get();
        await get().updateHealthProfile({
          conditions: profile.conditions.filter(c => c !== condition),
        });
      },

      removeMedication: async (medication: string) => {
        const { profile } = get();
        await get().updateHealthProfile({
          medications: profile.medications.filter(m => m !== medication),
        });
      },

      removeAllergy: async (allergy: string) => {
        const { profile } = get();
        await get().updateHealthProfile({
          allergies: profile.allergies.filter(a => a !== allergy),
        });
      },

      getHealthContext: () => {
        const { profile } = get();
        const parts: string[] = [];

        if (profile.symptoms.length > 0) {
          parts.push(`Symptoms: ${profile.symptoms.join(', ')}`);
        }
        if (profile.conditions.length > 0) {
          parts.push(`Health Conditions: ${profile.conditions.join(', ')}`);
        }
        if (profile.medications.length > 0) {
          parts.push(`Medications: ${profile.medications.join(', ')}`);
        }
        if (profile.allergies.length > 0) {
          parts.push(`Allergies: ${profile.allergies.join(', ')}`);
        }
        if (profile.generalNotes) {
          parts.push(`Notes: ${profile.generalNotes}`);
        }

        return parts.length > 0 
          ? `Patient Health Context:\n${parts.join('\n')}\n\nRemember this information throughout the conversation and reference it when relevant.`
          : '';
      },

      clearProfile: async () => {
        await get().updateHealthProfile(DEFAULT_PROFILE);
      },
    }),
    {
      name: 'health-profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        userId: state.userId,
      }),
    }
  )
);

