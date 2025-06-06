import { Portal } from '@gorhom/portal';
import { useState, useCallback, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Toast } from 'toastify-react-native';
import { useAuth } from '~/context/AuthContext';
import CodeModal from './CodeModal';
import Field from '../common/Field';
import PhoneInput, { Country } from '../common/PhoneInput';
import { Button } from '../common/Button';
import { useAppContext } from '~/context/AppContext';

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

  const { handleSubmit, getValues, setValue } = methods;
  const [codeModalVisible, setCodeModalVisible] = useState(false);

  const onSubmit = useCallback(async () => {
    const { phoneNumber, country } = getValues();
    if (!phoneNumber || !country)
      return console.log('no phone number or country', { phoneNumber, country });

    showLoading();
    signInWithPhoneNumber(country.dial_code + phoneNumber, () => {
      Toast.success('Please check your phone for the OTP', 'bottom');
      setCodeModalVisible(true);
    }).finally(hideLoading);
  }, [getValues, hideLoading, showLoading, signInWithPhoneNumber]);

  useEffect(() => {
    if (!error) return;
    const message = (error as any)?.message;

    Toast.error(message, 'bottom');
  }, [error]);

  const onCodeSubmit = useCallback(() => {
    const { code } = getValues();
    if (!code) return console.log('no code');

    showLoading();
    verifyCode(code, () => {
      setCodeModalVisible(false);
      Toast.success('Logged in successfully', 'bottom');
    }).finally(hideLoading);
  }, [getValues, hideLoading, showLoading, verifyCode]);

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
              value={value}
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
      <Portal>
        <FormProvider {...methods}>
          <CodeModal
            visible={codeModalVisible}
            onSubmit={handleSubmit(onCodeSubmit)}
            onClose={() => {
              setCodeModalVisible(false);
              setValue('code', '');
            }}
          />
        </FormProvider>
      </Portal>
    </>
  );
}

export default SignInWithPhone;
