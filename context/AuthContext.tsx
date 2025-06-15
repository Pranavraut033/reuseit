import { useMutation } from '@apollo/client';
import {
  FirebaseAuthTypes,
  signInWithPhoneNumber as faSignInWithPhoneNumber,
  getAuth,
  onAuthStateChanged,
} from '@react-native-firebase/auth';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { GOOGLE_SIGN_IN_MUTATION } from '~/gql/auth/googleSignIn';

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
  const [_error, setError] = useState<unknown | null>(null);
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

  const [update, { error: mutationError, reset }] = useMutation(GOOGLE_SIGN_IN_MUTATION);

  const error = _error || mutationError;

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
    const unsubscribe = onAuthStateChanged(getAuth(), async (user) => {
      if (user) {
        await update({
          variables: {
            data: {
              uid: user.uid,
              displayName: user.displayName ?? '',
              email: user.email ?? '',
              emailVerified: user.emailVerified,
              isAnonymous: user.isAnonymous,
              phoneNumber: user.phoneNumber,
              photoURL: user.photoURL,
            },
          },
        })
          .then((res) => {
            setCurrentUser(user);
          })
          .catch((err) => setError(err))
          .finally(() => reset());
      } else {
        setCurrentUser(null);
      }

      if (isLoading) setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isLoading, reset, update]);

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
