import { useMutation } from '@apollo/client/react';
import {
  FirebaseAuthTypes,
  signInWithPhoneNumber as faSignInWithPhoneNumber,
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SIGN_IN_MUTATION } from '~/src/gql/auth';
import { type User, useStore } from '~/src/store';
import { apolloClient, httpLink } from '~/src/utils/apollo';
import { setContext } from '@apollo/client/link/context';

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
  signInWithPhoneNumber: (phoneNumber: string, onSuccess?: () => void) => Promise<void>;
  signInWithGoogle: (onSuccess?: () => void) => Promise<void>;
  signOut: () => Promise<void>;
  user: User | null;
  setUser: (user: User | null) => void;
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
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(true);
  const setToken = useStore((state) => state.setToken);
  const token = useStore((state) => state.token);
  const loadToken = useStore((state) => state.loadToken);
  const [_error, setError] = useState<unknown | null>(null);
  const confirmationRef = useRef<FirebaseAuthTypes.ConfirmationResult | null>(
    null
  );

  useEffect(() => {
    loadToken().catch((err) => {
      console.error('Error loading token:', err);
    });
  }, [loadToken]);

  const signInWithPhoneNumber = useCallback(async (phoneNumber: string, onSuccess?: () => void) => {
    if (!phoneNumber) return;

    try {
      const confirmationResult = await faSignInWithPhoneNumber(getAuth(), phoneNumber);

      onSuccess?.();
      confirmationRef.current = confirmationResult;
    } catch (error) {
      setError(error);
    }
  }, []);

  const signInWithGoogle = useCallback(async (onSuccess?: () => void) => {
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();

      // Try the new style of google-sign in result, from v13+ of that module
      let idToken = signInResult.data?.idToken;
      if (!idToken) {
        // if you are using older versions of google-signin, try old style result
        idToken = (signInResult as any).idToken;
      }

      if (!idToken) {
        throw new Error('No ID token found');
      }

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      const response = await signInWithCredential(getAuth(), googleCredential);
      await handleUserSignIn(response.user);
      onSuccess?.();
    } catch (error) {
      setError(error);
      throw error;
    }
  }, []);

  const [serverSignIn, { error: mutationError, reset }] = useMutation(SIGN_IN_MUTATION);

  const handleUserSignIn = useCallback((user: FirebaseAuthTypes.User) => {
    return serverSignIn({
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
        const authToken = res.data?.signIn.token;
        setToken(authToken || null);
        setUser({ ...res.data!.signIn.user, googleUser: user });
      })
      .finally(() => reset());
  }, [reset, serverSignIn, setToken, setUser, user]);
  const error = _error || mutationError;

  const verifyOtp = useCallback(
    async (code: string, onSuccess?: () => void) => {
      if (!confirmationRef.current) return;

      try {
        const response = await confirmationRef.current.confirm(code);
        if (!response?.user) throw new Error('No user found after OTP verification');
        await handleUserSignIn(response.user);
        onSuccess?.();
      } catch (error) {
        setError(error);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      if (getAuth().currentUser)
        await getAuth().signOut()
    } catch (error) {
      console.log('Error signing out:', error);
    }

    confirmationRef.current = null;
    setUser(null);
    setToken(null);
  }, [setUser, setToken]);

  useEffect(() => {
    const authLink = setContext((_, { headers }) => ({
      headers: { ...headers, authorization: token ? `Bearer ${token}` : '' },
    }));

    // Compose authLink with the base httpLink to avoid stacking on updates
    apolloClient.setLink(authLink.concat(httpLink));
  }, [token]);

  useEffect(
    () =>
      onAuthStateChanged(getAuth(), async (user) => {
        if (!user) {
          return signOut();
        }

        if (!token) {
          await handleUserSignIn(user);
        }

        if (isLoading) setIsLoading(false);
      }),
    [isLoading, reset, setUser, setIsLoading, serverSignIn, setToken, signOut]
  );

  const context = useMemo(
    () => ({
      error,
      isLoading,
      setUser,
      signInWithPhoneNumber,
      signInWithGoogle,
      signOut,
      user,
      verifyCode: verifyOtp,
    }),
    [error, isLoading, setUser, signInWithPhoneNumber, signInWithGoogle, signOut, user, verifyOtp]
  );

  return <AuthContext.Provider value={context}>{children}</AuthContext.Provider>;
};
