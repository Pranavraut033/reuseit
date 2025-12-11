import { setContext } from '@apollo/client/link/context';
import { useMutation } from '@apollo/client/react';
import {
  FirebaseAuthTypes,
  getAuth,
  getIdToken,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPhoneNumber as faSignInWithPhoneNumber,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { jwtDecode } from 'jwt-decode';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { SignInMutation, SignInMutationVariables } from '~/__generated__/graphql';
import { SIGN_IN_MUTATION } from '~/gql/auth';
import { type User, useStore } from '~/store';
import { apolloClient, httpLink } from '~/utils/apollo';

// Helper function to check if JWT is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: { exp: number } = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true; // If can't decode, consider expired
  }
};

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '54651170211-hbq96bq9l72ovsftr62odvbumsd431k0.apps.googleusercontent.com',
  iosClientId: '54651170211-pm2no130q54k86le3tbat9p5b5r5g2ik.apps.googleusercontent.com',
  scopes: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid',
  ],
});

export type AuthContextType = {
  error: unknown;
  isLoading: boolean;
  isReady: boolean;
  setUser: (user: User | null) => void;
  signInWithGoogle: (onSuccess?: () => void) => Promise<void>;
  signInWithPhoneNumber: (phoneNumber: string, onSuccess?: () => void) => Promise<void>;
  signOut: () => Promise<void>;
  user: User | null;
  verifyCode: (code: string, onSuccess?: () => void) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) throw new Error('useAuth must be used within an AuthProvider');

  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [_error, setError] = useState<unknown | null>(null);
  const [fUser, setFUser] = useState<FirebaseAuthTypes.User | null>(getAuth().currentUser);
  const [isLoading, setIsLoading] = useState(false);
  const confirmationRef = useRef<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const isLoadingRef = useRef(false);
  const isSigningInRef = useRef(false);
  const isHandlingAuthStateRef = useRef(false);
  const setToken = useStore((state) => state.setToken);
  const setUser = useStore((state) => state.setUser);
  const stateLoaded = useStore((state) => state.ready);
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);

  const signInWithPhoneNumber = useCallback(async (phoneNumber: string, onSuccess?: () => void) => {
    if (!phoneNumber?.trim() || isLoadingRef.current) return;
    setIsLoading(true);
    try {
      const confirmationResult = await faSignInWithPhoneNumber(getAuth(), phoneNumber);

      onSuccess?.();
      confirmationRef.current = confirmationResult;
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const [
    serverSignIn,
    { data: signInData, error: mutationError, reset: serverReset, loading: isServerLoading },
  ] = useMutation<SignInMutation, SignInMutationVariables>(SIGN_IN_MUTATION);

  useEffect(() => {
    if (!signInData) return;
    const { token, user: _user } = signInData.signIn;
    setToken(token || null);
    setUser({ ..._user, googleUser: fUser || undefined });
  }, [signInData, setToken, stateLoaded, setUser, fUser]);

  const handleUserSignIn = useCallback(
    async (user: FirebaseAuthTypes.User) => {
      if (isSigningInRef.current) return;
      isSigningInRef.current = true;
      try {
        const idToken = await getIdToken(user);
        serverSignIn({ variables: { data: { idToken } } });
      } finally {
        isSigningInRef.current = false;
      }
    },
    [serverSignIn],
  );

  const signInWithGoogle = useCallback(
    async (onSuccess?: () => void) => {
      if (isLoadingRef.current) return;
      try {
        setIsLoading(true);
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

        const signInResult = await GoogleSignin.signIn();

        let idToken: string | undefined =
          signInResult.data?.idToken ?? (signInResult as { idToken?: string }).idToken; // Fallback for older versions

        if (!idToken) {
          throw new Error('No ID token found');
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const googleCredential = GoogleAuthProvider.credential(idToken);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const response = await signInWithCredential(getAuth(), googleCredential);
        await handleUserSignIn(response.user);
        setError(null); // Clear any previous errors
        onSuccess?.();
      } catch (_e) {
        const error = _e as Error;
        setError(error.message || 'Authentication failed');

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleUserSignIn],
  );

  const error = _error || mutationError;

  const verifyOtp = useCallback(
    async (code: string, onSuccess?: () => void) => {
      if (isLoadingRef.current || !confirmationRef.current) return;

      setIsLoading(true);

      try {
        const response = await confirmationRef.current.confirm(code);
        if (!response?.user) throw new Error('No user found after OTP verification');
        await handleUserSignIn(response.user);
        setError(null); // Clear any previous errors
        onSuccess?.();
      } catch (error) {
        setError(error);
      } finally {
        setIsLoading(false);
      }
    },
    [handleUserSignIn],
  );

  const signOut = useCallback(async () => {
    try {
      if (getAuth().currentUser) await getAuth().signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }

    confirmationRef.current = null;
    setUser(null);
    setToken(null);
    serverReset();
    isHandlingAuthStateRef.current = false; // Reset auth state handling
  }, [setUser, setToken, serverReset]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    const authLink = setContext((_, { headers }) => ({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      headers: { ...headers, authorization: token ? `Bearer ${token}` : '' },
    }));

    // Compose authLink with the base httpLink to avoid stacking on updates
    apolloClient.setLink(authLink.concat(httpLink));
  }, [token]);

  useEffect(() => {
    if (!stateLoaded || (token && user && fUser) || isHandlingAuthStateRef.current) return;

    isHandlingAuthStateRef.current = true;

    (async () => {
      if (!fUser) {
        signOut();
        return;
      }

      const _token = token;

      if (!_token || !user || isTokenExpired(_token)) {
        handleUserSignIn(fUser);
      }
    })().finally(() => {
      isHandlingAuthStateRef.current = false;
    });
  }, [token, stateLoaded, user, handleUserSignIn, fUser, signOut]);

  useEffect(() => onAuthStateChanged(getAuth(), setFUser), []);

  const context = {
    error,
    isLoading: isLoading || isServerLoading,
    isReady: stateLoaded,
    setUser,
    signInWithGoogle,
    signInWithPhoneNumber,
    signOut,
    user,
    verifyCode: verifyOtp,
  };

  return <AuthContext.Provider value={context}>{children}</AuthContext.Provider>;
};
