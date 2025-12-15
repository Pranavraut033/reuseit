import { setContext } from '@apollo/client/link/context';
import { useMutation } from '@apollo/client/react';
import * as Auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Toast } from 'toastify-react-native';

import { SignInMutation, SignInMutationVariables } from '~/__generated__/graphql';
import { SIGN_IN_MUTATION } from '~/gql/auth';
import { type User, useStore } from '~/store';
import { apolloClient, httpLink } from '~/utils/apollo';
import { getErrorMessage, normalizeError } from '~/utils/error';
import { createLogger } from '~/utils/logger';

const LOG = createLogger('AuthContext');

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
  error: { code?: string | number; message: string } | null;
  isLoading: boolean;
  isReady: boolean;
  setUser: (user: User | null) => void;
  // Start email-first flow: pass just email, inspect methods, then choose password or passwordless
  startEmailSignIn: (email: string) => Promise<void>;
  sendSignInLinkToEmail: (email: string, onSuccess?: () => void) => Promise<void>;
  sendPasswordlessSignInLink: (onSuccess?: () => void) => Promise<void>;
  signInWithEmailLink: (email: string, emailLink: string, onSuccess?: () => void) => Promise<void>;
  // Sign in or register with email + password in a single action.
  signInOrRegisterWithEmail: (
    email: string,
    password: string,
    onSuccess?: () => void,
  ) => Promise<void>;
  signInWithGoogle: (onSuccess?: () => void) => Promise<void>;
  signInWithPhoneNumber: (phoneNumber: string, onSuccess?: () => void) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: User) => void;
  user: User | null;
  verifyCode: (code: string, onSuccess?: () => void) => Promise<void>;
  // Helper metadata for UI flow
  pendingEmail?: string | null;
  availableMethods?: string[] | null;
  currentAuthFlow?: 'password' | 'emailLink' | null;
  clearPendingEmailFlow?: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) throw new Error('useAuth must be used within an AuthProvider');

  return context;
};

function fetchCurrentUser() {
  return Auth.getAuth().currentUser;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [error, setError] = useState<{ code?: string | number; message: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const confirmationRef = useRef<Auth.FirebaseAuthTypes.ConfirmationResult | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [availableMethods, setAvailableMethods] = useState<string[] | null>(null);
  const [currentEmailFlow, setCurrentEmailFlow] = useState<'password' | 'emailLink' | null>(null);
  const isLoadingRef = useRef(false);
  const isSigningInRef = useRef(false);
  const setToken = useStore((state) => state.setToken);
  const setUser = useStore((state) => state.setUser);
  const stateLoaded = useStore((state) => state.ready);
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);

  const signInWithPhoneNumber = useCallback(async (phoneNumber: string, onSuccess?: () => void) => {
    if (!phoneNumber?.trim() || isLoadingRef.current) return;
    setIsLoading(true);
    LOG.debug('signInWithPhoneNumber start', { phoneLast4: phoneNumber.slice(-4) });
    try {
      const confirmationResult = await Auth.signInWithPhoneNumber(Auth.getAuth(), phoneNumber);

      onSuccess?.();
      confirmationRef.current = confirmationResult;
      LOG.info('signInWithPhoneNumber confirmation created');
    } catch (error) {
      const normalized = normalizeError(error, 'auth.invalidPhone');
      LOG.error('signInWithPhoneNumber failed', normalized);
      setError(normalized);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start an email-first flow: check which sign-in methods are available for the email
  const startEmailSignIn = useCallback(async (email: string) => {
    try {
      if (!email?.trim()) throw new Error('Invalid email');

      setIsLoading(true);
      // fetch sign-in methods for the email from Firebase
      // Using react-native-firebase's fetchSignInMethodsForEmail
      const methods = await Auth.fetchSignInMethodsForEmail(Auth.getAuth(), email);
      console.log({ methods });

      setPendingEmail(email);
      setAvailableMethods(methods);
      // Prefer password if available
      if (methods.includes('password')) setCurrentEmailFlow('password');
      else setCurrentEmailFlow('emailLink');
    } catch (error) {
      setAvailableMethods(null);
      setPendingEmail(email);
      setCurrentEmailFlow(null);
      setError(normalizeError(error, 'auth.emailCheckFailed'));
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
    setUser(_user);
  }, [signInData, setToken, stateLoaded, setUser]);

  const signOut = useCallback(async () => {
    LOG.info('signOut invoked', fetchCurrentUser()?.uid);

    try {
      if (fetchCurrentUser()) await Auth.signOut(Auth.getAuth());
    } catch (error) {
      LOG.error('Error signing out:', getErrorMessage(error));
    }

    confirmationRef.current = null;
    setUser(null);
    setError(null);
    setToken(null);
    serverReset();
    isSigningInRef.current = false; // Reset auth state handling
    // Clear any pending email flow on sign out
    setPendingEmail(null);
    setAvailableMethods(null);
    setCurrentEmailFlow(null);
  }, [setUser, setToken, serverReset]);

  const handleUserSignIn = useCallback(async () => {
    if (isSigningInRef.current) return;
    isSigningInRef.current = true;
    const currentUser = fetchCurrentUser();

    try {
      if (currentUser) {
        LOG.debug('handleUserSignIn', { uid: currentUser.uid });
        const idToken = await Auth.getIdToken(currentUser);
        LOG.debug('obtained id token, sending to server (token omitted)');
        if (!token || isTokenExpired(token) || !user) {
          LOG.debug('Token missing or expired or missing user, handling user sign-in');
          await serverSignIn({ variables: { data: { idToken } } });
        } else {
          LOG.debug('Valid token present, no action needed');
        }
      } else {
        LOG.info('No user signed in, clearing auth state');
        signOut();
      }
      isSigningInRef.current = false;
    } finally {
      isSigningInRef.current = false;
    }
  }, [serverSignIn, signOut, token, user]);

  const signInOrRegisterWithEmail = useCallback(
    async (email: string, password: string, onSuccess?: () => void) => {
      if (isLoadingRef.current) return;
      LOG.debug('signInOrRegisterWithEmail start', { email });
      setIsLoading(true);
      try {
        // Check existing methods
        const methods = await Auth.fetchSignInMethodsForEmail(Auth.getAuth(), email);
        console.log({ methods });

        let response;
        if (methods.includes('password')) {
          // Existing account, sign in
          response = await Auth.signInWithEmailAndPassword(Auth.getAuth(), email, password);
        } else {
          // No password-based account exists -> create user and sign in
          response = await Auth.createUserWithEmailAndPassword(Auth.getAuth(), email, password);
        }

        LOG.info('signInOrRegisterWithEmail success', { uid: response.user.uid });

        // Clear pending flow state
        setPendingEmail(null);
        setAvailableMethods(null);
        setCurrentEmailFlow(null);

        setError(null);
        onSuccess?.();
      } catch (err) {
        const normalized = normalizeError(err, 'auth.unknownError');
        LOG.error('signInOrRegisterWithEmail failed', normalized);
        setError(normalized);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const signInWithGoogle = useCallback(async (onSuccess?: () => void) => {
    if (isLoadingRef.current) return;
    LOG.debug('signInWithGoogle start');
    try {
      setIsLoading(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const signInResult = await GoogleSignin.signIn();

      const idToken: string | undefined =
        signInResult.data?.idToken ?? (signInResult as { idToken?: string }).idToken; // Fallback for older versions

      if (!idToken) throw new Error('No ID token found');

      const googleCredential = Auth.GoogleAuthProvider.credential(idToken) as unknown;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await Auth.signInWithCredential(Auth.getAuth(), googleCredential as any);
      setError(null); // Clear any previous errors
      LOG.info('signInWithGoogle success', { uid: response.user.uid });
      onSuccess?.();
    } catch (e) {
      const normalized = normalizeError(e, 'auth.googleFailed');
      LOG.error('signInWithGoogle failed', normalized);
      setError(normalized);
      throw new Error(normalized.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send a passwordless sign-in link to an arbitrary email
  const sendSignInLinkToEmail = useCallback(async (email: string, onSuccess?: () => void) => {
    if (isLoadingRef.current) return;
    try {
      LOG.debug('sendSignInLinkToEmail start', { email });
      setIsLoading(true);

      const actionCodeSettings = {
        url: Linking.createURL(''),
        handleCodeInApp: true,
      };

      // Call the Firebase auth method directly (avoid naming collision)
      await Auth.sendSignInLinkToEmail(Auth.getAuth(), email, actionCodeSettings);
      await SecureStore.setItemAsync('emailForSignIn', email);
      setError(null);
      LOG.info('sendSignInLinkToEmail success', { email });
      onSuccess?.();
    } catch (e) {
      const normalized = normalizeError(e, 'auth.emailCheckFailed');
      LOG.error('sendSignInLinkToEmail failed', normalized);
      setError(normalized);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send a passwordless sign-in link for the current pending email
  const sendPasswordlessSignInLink = useCallback(
    async (onSuccess?: () => void) => {
      if (!pendingEmail) throw new Error('No pending email for passwordless sign in');
      LOG.debug('sendPasswordlessSignInLink start', { pendingEmail });
      await sendSignInLinkToEmail(pendingEmail, () => {
        setCurrentEmailFlow('emailLink');
        LOG.info('sendPasswordlessSignInLink requested');
        onSuccess?.();
      });
    },
    [pendingEmail, sendSignInLinkToEmail],
  );

  const signInWithEmailLink = useCallback(
    async (email: string, emailLink: string, onSuccess?: () => void) => {
      if (isLoadingRef.current) return;
      try {
        setIsLoading(true);

        if (await Auth.isSignInWithEmailLink(Auth.getAuth(), emailLink)) {
          await Auth.signInWithEmailLink(Auth.getAuth(), email, emailLink);
          await SecureStore.deleteItemAsync('emailForSignIn');
          setError(null);
          onSuccess?.();
        } else {
          throw new Error('Invalid sign-in link');
        }
      } catch (e) {
        setError(normalizeError(e, 'auth.emailCheckFailed'));
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const verifyOtp = useCallback(async (code: string, onSuccess?: () => void) => {
    if (isLoadingRef.current || !confirmationRef.current) return;

    setIsLoading(true);

    try {
      LOG.debug('verifyOtp start', { codeLength: code?.length ?? 0 });
      const response = await confirmationRef.current.confirm(code);
      if (!response?.user) throw new Error('No user found after OTP verification');
      setError(null); // Clear any previous errors
      LOG.info('verifyOtp success', { uid: response.user.uid });
      onSuccess?.();
    } catch (error) {
      const normalized = normalizeError(error, 'auth.unknownError');
      LOG.error('verifyOtp failed', normalized);
      setError(normalized);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    const authLink = setContext((_, { headers }) => {
      const authHeader = token ? `Bearer ${token}` : '';
      const currentHeaders = (headers as Record<string, string | undefined>) || {};

      return { headers: { ...currentHeaders, authorization: authHeader } };
    });

    apolloClient.setLink(authLink.concat(httpLink));
  }, [token]);

  useEffect(
    () =>
      Auth.onAuthStateChanged(Auth.getAuth(), (user) => {
        LOG.debug('onAuthStateChanged triggered', { uid: user?.uid });
        handleUserSignIn();
      }),
    [handleUserSignIn],
  );

  const handleSignInUrl = useCallback(async (url: string) => {
    LOG.debug('handleSignInUrl invoked');
    if (await Auth.isSignInWithEmailLink(Auth.getAuth(), url)) {
      const email = await SecureStore.getItemAsync('emailForSignIn');
      if (email) {
        try {
          await Auth.signInWithEmailLink(Auth.getAuth(), email, url);
          await SecureStore.deleteItemAsync('emailForSignIn');
          setError(null);
          LOG.info('handled sign-in link for email', { email });
          // Clear pending email flow as sign-in is complete
          setPendingEmail(null);
          setAvailableMethods(null);
          setCurrentEmailFlow(null);
        } catch (_error) {
          const normalized = normalizeError(_error, 'auth.emailCheckFailed');
          LOG.error('handleSignInUrl failed', normalized);
          setError(normalized);
        }
      }
    }
  }, []);

  useEffect(() => {
    const handleGetInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        handleSignInUrl(url);
      }
    };

    const handleDeepLink = (event: { url: string }) => {
      handleSignInUrl(event.url);
    };

    handleGetInitialURL();
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [handleSignInUrl]);

  const displayError =
    error || (mutationError ? normalizeError(mutationError, 'auth.unknownError') : null);

  useEffect(() => {
    if (!displayError) return;

    Toast.show({
      type: 'error',
      text1: displayError.code?.toString() || displayError.message,
      text2: displayError.code ? displayError.message : undefined,
    });
  }, [displayError]);

  const context = {
    error: displayError,
    isLoading: isLoading || isServerLoading,
    isReady: stateLoaded,
    startEmailSignIn,
    sendSignInLinkToEmail,
    sendPasswordlessSignInLink,
    signInOrRegisterWithEmail,
    clearPendingEmailFlow: () => {
      setPendingEmail(null);
      setAvailableMethods(null);
      setCurrentEmailFlow(null);
    },
    setUser,
    signInWithEmailLink,
    signInWithGoogle,
    signInWithPhoneNumber,
    signOut,
    updateUser: setUser,
    user,
    verifyCode: verifyOtp,
    // expose helpful bits for the UI to drive the single-field flow
    // (can be null or string[])
    pendingEmail,
    availableMethods,
    currentAuthFlow: currentEmailFlow,
  };

  return <AuthContext.Provider value={context}>{children}</AuthContext.Provider>;
};
