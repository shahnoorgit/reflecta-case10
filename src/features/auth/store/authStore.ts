/**
 * Auth Store
 * Manages user authentication state with Supabase
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  // User state
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      initialize: async () => {
        if (!isSupabaseConfigured()) {
          set({ isInitialized: true, isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          // First check if we have a persisted session in Zustand
          const persistedSession = get().session;
          if (persistedSession?.access_token) {
            console.log('Restoring session from storage...');
            await supabase.auth.setSession({
              access_token: persistedSession.access_token,
              refresh_token: persistedSession.refresh_token,
            });
          }

          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) throw error;

          set({
            session,
            user: session?.user ?? null,
            isInitialized: true,
            isLoading: false,
          });

          // Listen for auth changes
          supabase.auth.onAuthStateChange((_event, session) => {
            set({
              session,
              user: session?.user ?? null,
            });
          });
        } catch (error: any) {
          set({
            error: error.message,
            isInitialized: true,
            isLoading: false,
          });
        }
      },

      signUp: async (email: string, password: string, name?: string) => {
        if (!isSupabaseConfigured()) {
          set({ error: 'Supabase not configured' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: name },
            },
          });

          if (error) throw error;

          // Manually set session if available
          if (data.session) {
            await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            });
          }

          console.log('Signed up:', data.user?.email);

          set({
            user: data.user,
            session: data.session,
            isLoading: false,
          });

          return true;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      signIn: async (email: string, password: string) => {
        if (!isSupabaseConfigured()) {
          set({ error: 'Supabase not configured' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          // Manually set session to ensure it's active
          if (data.session) {
            await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            });
          }

          console.log('Signed in:', data.user?.email);

          set({
            user: data.user,
            session: data.session,
            isLoading: false,
          });

          return true;
        } catch (error: any) {
          console.error('Sign in error:', error.message);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      signInWithGoogle: async () => {
        if (!isSupabaseConfigured()) {
          set({ error: 'Supabase not configured' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
          });

          if (error) throw error;

          set({ isLoading: false });
          return true;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          if (isSupabaseConfigured()) {
            await supabase.auth.signOut();
          }
          set({
            user: null,
            session: null,
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      resetPassword: async (email: string) => {
        if (!isSupabaseConfigured()) {
          set({ error: 'Supabase not configured' });
          return false;
        }

        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email);
          
          if (error) throw error;

          set({ isLoading: false });
          return true;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        session: state.session,
      }),
    }
  )
);

export default useAuthStore;

