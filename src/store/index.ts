import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { create } from 'zustand';
import { SignInMutation } from '~/src/__generated__/graphql';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type User = SignInMutation['signIn']['user'] & {
  googleUser?: FirebaseAuthTypes.User;
};

export interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  loadToken: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  token: null,
  setToken: (token) => {
    if (!token?.trim()) {
      AsyncStorage.removeItem('auth.token');
      set({ token: null });
      return;
    }

    AsyncStorage.setItem('auth.token', token);
    set({ token });
  },
  loadToken: async () => {
    const token = await AsyncStorage.getItem('auth.token');
    set({ token: token || null });
  },
}));

// Usage: Call useStore.getState().loadToken() on app startup to load the token.
