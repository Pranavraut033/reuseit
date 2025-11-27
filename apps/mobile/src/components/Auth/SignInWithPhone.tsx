import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Toast } from 'toastify-react-native';

import { useAppContext } from '~/context/AppContext';
import { useAuth } from '~/context/AuthContext';

import { Button } from '../common/Button';
import Field from '../common/Field';
import PhoneInput, { Country } from '../common/PhoneInput';
import CodeModal from './CodeModal';

function SignInWithPhone() {
  const { signInWithPhoneNumber, verifyCode, error } = useAuth();
  const methods = useForm({
    defaultValues: {
      phoneNumber: '',
      country: null as Country | null,
      code: '',
    },
  });

  const { showLoading, hideLoading } = useAppContext();

  const { handleSubmit, getValues, setValue, watch } = methods;
  const [codeModalVisible, setCodeModalVisible] = useState(false);

  const watchedPhone = watch('phoneNumber');
  const watchedCountry = watch('country');

  const fullPhoneNumber = useMemo(() => {
    return watchedCountry ? watchedCountry.dial_code + watchedPhone : '';
  }, [watchedPhone, watchedCountry]);

  const onSubmit = useCallback(async () => {
    const { phoneNumber, country } = getValues();
    if (!phoneNumber || !country) return Toast.error('Please enter a valid phone number', 'bottom');

    const full = country.dial_code + phoneNumber;
    showLoading();
    signInWithPhoneNumber(full, () => {
      Toast.success('Please check your phone for the OTP', 'bottom');
      setCodeModalVisible(true);
    }).finally(hideLoading);
  }, [getValues, hideLoading, showLoading, signInWithPhoneNumber]);

  useEffect(() => {
    if (!error) return;
    const message = (error as any)?.message as string;

    Toast.error(message, 'bottom');
  }, [error]);

  const onCodeSubmit = useCallback(() => {
    const { code } = getValues();
    if (!code) return Toast.error('Please enter the verification code', 'bottom');

    showLoading();
    verifyCode(code, () => {
      setCodeModalVisible(false);
      Toast.success('Logged in successfully', 'bottom');
    }).finally(hideLoading);
  }, [getValues, hideLoading, showLoading, verifyCode]);

  const onResend = useCallback(() => {
    if (!fullPhoneNumber) return;
    showLoading();
    signInWithPhoneNumber(fullPhoneNumber, () => {
      Toast.success('OTP resent. Please check your phone.', 'bottom');
    }).finally(hideLoading);
  }, [fullPhoneNumber, hideLoading, showLoading, signInWithPhoneNumber]);

  return (
    <>
      <FormProvider {...methods}>
        <Field
          name="phoneNumber"
          className="mb-5"
          rules={{
            required: 'Phone number is required',
            pattern: {
              value: /^\d{9,14}$/,
              message: 'Please enter a valid phone number',
            },
          }}>
          {({ onChange, onBlur, value }) => (
            <PhoneInput
              value={value as string}
              onChange={onChange}
              onBlur={onBlur}
              onCountrySelect={(c) => setValue('country', c)}
            />
          )}
        </Field>

        {/* Continue with Phone */}
        <Button
          title="Continue with Phone"
          className="w-full rounded-lg"
          onPress={handleSubmit(onSubmit)}
        />
      </FormProvider>
      <FormProvider {...methods}>
        <CodeModal
          visible={codeModalVisible}
          onSubmit={handleSubmit(onCodeSubmit)}
          onResend={onResend}
          onClose={() => {
            setCodeModalVisible(false);
            setValue('code', '');
          }}
        />
      </FormProvider>
    </>
  );
}

export default SignInWithPhone;
