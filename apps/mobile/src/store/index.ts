import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { SignInMutation } from '~/__generated__/graphql';

export type User = SignInMutation['signIn']['user'] & {
  googleUser?: FirebaseAuthTypes.User;
};

export interface AppState {
  loadState: () => Promise<void>;
  loadToken: () => Promise<string | null>;
  ready: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  token: string | null;
  user: User | null;
}

export const useStore = create<AppState>((set) => ({
  ready: false,
  token: null,
  user: null,
  setUser: (user) => {
    if (!user) {
      AsyncStorage.removeItem('auth.user');
      set({ user: null });
      return;
    }

    AsyncStorage.setItem('auth.user', JSON.stringify({ ...user, googleUser: undefined }));
    set({ user });
  },
  setToken: (token) => {
    if (!token?.trim()) {
      SecureStore.deleteItemAsync('auth.token');
      set({ token: null });
      return;
    }

    SecureStore.setItemAsync('auth.token', token);
    set({ token });
  },
  loadToken: async () => {
    const token = await SecureStore.getItemAsync('auth.token');
    set({ token: token || null });
    return token || null;
  },
  loadState: async () => {
    const [token, userJson] = await Promise.all([
      SecureStore.getItemAsync('auth.token'),
      AsyncStorage.getItem('auth.user'),
    ]);

    const user = userJson ? (JSON.parse(userJson) as User) : null;

    set({
      token: token || null,
      user,
      ready: true,
    });
  },
}));
