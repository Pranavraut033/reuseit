import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { Region } from 'react-native-maps';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

import { SignInMutation } from '~/__generated__/graphql';

export type User = SignInMutation['signIn']['user'] & {
  googleUser?: FirebaseAuthTypes.User;
};

export interface AppState {
  onboardingCompleted: boolean;
  ready: boolean;
  setOnboardingCompleted: (completed: boolean) => void;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  token: string | null;
  user: User | null;
  location: Region | null;
  setLocation: (location: Region | null) => void;
}

export const useStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        onboardingCompleted: false,
        ready: false,
        token: null,
        user: null,
        location: null,
        setUser: (user) => {
          try {
            set({ user });
          } catch (e) {
            console.error('Error setting user:', e);
          }
        },
        setOnboardingCompleted: (completed) => {
          try {
            set({ onboardingCompleted: completed });
          } catch (e) {
            console.error('Error setting onboarding:', e);
          }
        },
        setToken: async (token) => {
          try {
            if (!token?.trim()) {
              await SecureStore.deleteItemAsync('auth.token');
              set({ token: null });
              return;
            }
            await SecureStore.setItemAsync('auth.token', token);
            set({ token });
          } catch (e) {
            console.error('Error setting token:', e);
          }
        },
        setLocation: (location) => {
          try {
            set({ location });
          } catch (e) {
            console.error('Error setting location:', e);
          }
        },
      }),
      {
        name: 'app-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          user: state.user,
          onboardingCompleted: state.onboardingCompleted,
        }),
        onRehydrateStorage: () => async (state) => {
          if (state) {
            try {
              const token = await SecureStore.getItemAsync('auth.token');
              state.token = token || null;
            } catch (e) {
              console.error('Error loading token on rehydrate:', e);
            }
            state.ready = true;
          }
        },
      },
    ),
    { name: 'app-store' },
  ),
);
