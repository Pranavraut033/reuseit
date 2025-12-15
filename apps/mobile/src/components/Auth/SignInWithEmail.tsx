import { getAuth, sendPasswordResetEmail } from '@react-native-firebase/auth';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Pressable, Text } from 'react-native';
import { Toast } from 'toastify-react-native';

import { Button } from '~/components/common/Button';
import Card from '~/components/common/Card';
import Field from '~/components/form/Field';
import { useAppContext } from '~/context/AppContext';
import { useAuth } from '~/context/AuthContext';
import { t } from '~/utils/i18n';

function SignInWithEmail() {
  const {
    startEmailSignIn,
    sendPasswordlessSignInLink,
    signInOrRegisterWithEmail,
    clearPendingEmailFlow,
    pendingEmail,
    availableMethods,
  } = useAuth();

  const methods = useForm({
    defaultValues: {
      email: pendingEmail ?? '',
      password: '',
    },
  });

  const { showLoading, hideLoading } = useAppContext();

  const { handleSubmit, getValues, setValue } = methods;

  const [isChecking, setIsChecking] = useState(false);
  const [isSendingLink, setIsSendingLink] = useState(false);

  useEffect(() => {
    // Keep email form synced with pending email in context
    if (pendingEmail) setValue('email', pendingEmail);
  }, [pendingEmail, setValue]);

  const onEmailSubmit = useCallback(async () => {
    const { email } = getValues();
    if (!email) return Toast.error(t('auth.invalidEmail'), 'bottom');

    setIsChecking(true);
    await startEmailSignIn(email);

    setIsChecking(false);
  }, [getValues, startEmailSignIn]);

  const onPasswordSubmit = useCallback(async () => {
    const { email, password } = getValues();
    if (!password) return Toast.error(t('auth.enterPassword'), 'bottom');

    showLoading();
    await signInOrRegisterWithEmail(email, password, () =>
      Toast.success(t('auth.loggedIn'), 'bottom'),
    );
    hideLoading();
  }, [getValues, hideLoading, showLoading, signInOrRegisterWithEmail]);

  const onSendLink = useCallback(async () => {
    setIsSendingLink(true);

    const p = sendPasswordlessSignInLink(() => {
      Toast.success(t('auth.emailLinkSent'), 'bottom');
    });

    if (!p) {
      setIsSendingLink(false);
      return;
    }

    p.finally(() => setIsSendingLink(false));
  }, [sendPasswordlessSignInLink]);

  const hasPassword = useMemo(
    () => (availableMethods ?? []).includes('password'),
    [availableMethods],
  );

  return (
    <FormProvider {...methods}>
      <Card className="mb-4 p-4">
        <Field
          name="email"
          className="mb-4"
          rules={{
            required: 'Email is required',
            pattern: {
              value: /^\S+@\S+$/i,
              message: 'Invalid email address',
            },
          }}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel={t('auth.continueWithEmail')}
        />

        <Text className="mb-3 text-sm text-gray-500">{t('auth.emailCheckInfo')}</Text>

        {/* If methods haven't been fetched yet, show primary continue button */}
        {!pendingEmail && (
          <Button
            title={t('auth.continueWithEmail')}
            className="w-full rounded-md"
            type="primary"
            loading={isChecking}
            onPress={handleSubmit(onEmailSubmit)}
            testID="email-continue"
            accessibilityLabel={t('auth.continueWithEmail')}
          />
        )}

        {/* If pendingEmail exists show password input (we support register or sign-in in one action) */}
        {pendingEmail && (
          <>
            <Field
              name="password"
              className="mb-4 mt-4"
              rules={{
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              }}
              placeholder="Password"
              secureTextEntry
            />

            <Button
              title={hasPassword ? t('auth.signIn') : 'Sign up'}
              className="w-full rounded-md"
              type="primary"
              onPress={handleSubmit(onPasswordSubmit)}
              testID="password-submit"
              accessibilityLabel={hasPassword ? t('auth.signIn') : 'Sign up'}
              loading={false}
            />

            {hasPassword ? (
              <Pressable
                onPress={async () => {
                  const { email } = getValues();
                  if (!email) return Toast.error(t('auth.invalidEmail'), 'bottom');
                  await sendPasswordResetEmail(getAuth(), email);
                  Toast.success(t('auth.passwordResetSent'), 'bottom');
                }}
                className="mt-2 mb-3"
                accessibilityRole="button"
                testID="forgot-password"
              >
                <Text className="text-sm text-primary">Forgot password?</Text>
              </Pressable>
            ) : null}

            <Button
              title={t('auth.useDifferentEmail')}
              className="w-full rounded-md mt-3"
              type="neutral"
              onPress={() => {
                clearPendingEmailFlow?.();
                setValue('password', '');
                setValue('email', '');
              }}
            />
          </>
        )}

        {/* Email-link option: still allow sending a sign-in link if desired */}
        {pendingEmail && !hasPassword && (
          <>
            <Button
              title={t('auth.continueWithEmailLink')}
              className="w-full rounded-md mt-3"
              type="neutral"
              onPress={onSendLink}
              loading={isSendingLink}
              testID="send-signin-link"
              accessibilityLabel={t('auth.continueWithEmailLink')}
            />
          </>
        )}
      </Card>
    </FormProvider>
  );
}

export default SignInWithEmail;
