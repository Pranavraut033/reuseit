import React from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Button } from '~/components/common/Button';
import Field from '~/components/form/Field';
import { t } from '~/utils/i18n';

const CodeModal: React.FC<{
  visible: boolean;
  onClose?: () => void;
  onSubmit?: () => void;
  onResend?: () => void;
}> = ({ visible, onClose, onSubmit, onResend }) => {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="slide">
      <TouchableOpacity
        className="flex-1 items-center justify-center bg-black/50"
        activeOpacity={1}
        onPress={onClose}>
        <View className="w-full flex-1 items-center justify-center">
          <View
            onStartShouldSetResponder={() => true}
            className="w-11/12 items-center rounded-lg border border-gray-100 bg-white p-6 shadow-card">
            <View className="mb-4 w-full flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-forest">{t('auth.enterOTP')}</Text>
              <TouchableOpacity
                onPress={onClose}
                className="p-1"
                accessibilityLabel={t('auth.close')}>
                <Text className="text-2xl text-gray-500">×</Text>
              </TouchableOpacity>
            </View>
            <Text className="mb-6 text-center text-sm leading-5 text-gray-600">
              {t('auth.otpPrompt')}
            </Text>
            <Field name="code" rules={{ required: t('auth.enterCode') }}>
              {({ value, onChange }) => (
                <TextInput
                  className="mb-6 w-full rounded-md border-2 border-gray-200 bg-gray-50 px-4 py-4 text-center text-2xl tracking-widest transition-colors focus:border-primary focus:bg-white"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={value as string}
                  onChangeText={onChange}
                  placeholder="------"
                  autoFocus
                />
              )}
            </Field>
            <Button
              title={t('auth.verify')}
              className="w-full rounded-md py-4 shadow-card"
              type="primary"
              onPress={() => onSubmit?.()}
            />
            {onResend && (
              <TouchableOpacity
                className="mt-4 rounded-md bg-gray-50 p-2"
                onPress={onResend}
                accessibilityRole="button">
                <Text className="text-center text-sm font-medium text-primary">
                  {t('auth.resend')}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity className="mt-3 p-2" onPress={onClose} accessibilityRole="button">
              <Text className="text-sm text-gray-500 underline">{t('auth.wrongPhone')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default CodeModal;
