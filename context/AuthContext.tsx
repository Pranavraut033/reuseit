import {
  signInWithPhoneNumber as faSignInWithPhoneNumber,
  FirebaseAuthTypes,
  getAuth,
  onAuthStateChanged,
} from '@react-native-firebase/auth';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type AuthContextType = {
  error: unknown;
  isLoading: boolean;
  signInWithPhoneNumber: (phoneNumber: string, onSuccess?: () => void) => Promise<void>;
  signOut: () => Promise<void>;
  user: FirebaseAuthTypes.User | null;
  verifyCode: (code: string, onSuccess?: () => void) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);
  const [confirmation, setConfirmation] = useState<FirebaseAuthTypes.ConfirmationResult | null>(
    null
  );

  const signInWithPhoneNumber = useCallback(async (phoneNumber: string, onSuccess?: () => void) => {
    if (!phoneNumber) return;

    try {
      const confirmationResult = await faSignInWithPhoneNumber(getAuth(), phoneNumber);
      console.log({ confirmationResult });

      onSuccess?.();
      setConfirmation(confirmationResult);
    } catch (error) {
      setError(error);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await getAuth().signOut();
    } catch (error) {
      setError(error);
    }
  }, []);

  const verifyOtp = useCallback(
    async (code: string, onSuccess?: () => void) => {
      if (!confirmation) return;

      try {
        await confirmation.confirm(code);
        onSuccess?.();
      } catch (error) {
        setError(error);
      }
    },
    [confirmation]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      setCurrentUser(user);

      if (isLoading) setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isLoading]);

  return (
    <AuthContext.Provider
      value={{
        error,
        isLoading: isLoading,
        signInWithPhoneNumber,
        signOut,
        user: currentUser,
        verifyCode: verifyOtp,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
