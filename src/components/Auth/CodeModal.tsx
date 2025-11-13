import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import Field from '../common/Field';
import { Button } from '../common/Button';

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
            className="w-11/12 items-center rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl">
            <View className="mb-4 w-full flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900">Enter OTP</Text>
              <TouchableOpacity onPress={onClose} className="p-1">
                <Text className="text-2xl text-gray-500">×</Text>
              </TouchableOpacity>
            </View>
            <Text className="mb-6 text-center text-sm leading-5 text-gray-600">
              Please enter the 6-digit code sent to your phone.
            </Text>
            <Field name="code" rules={{ required: 'Please enter the code' }}>
              {({ value, onChange }) => (
                <TextInput
                  className="mb-6 w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-4 text-center text-2xl tracking-widest transition-colors focus:border-primary focus:bg-white"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={value}
                  onChangeText={onChange}
                  placeholder="------"
                  autoFocus
                />
              )}
            </Field>
            <Button
              title="Verify"
              className="w-full rounded-xl bg-primary py-4 shadow-lg active:scale-95"
              onPress={() => onSubmit?.()}
            />
            {onResend && (
              <TouchableOpacity className="mt-4 rounded-lg bg-gray-50 p-2" onPress={onResend}>
                <Text className="text-center text-sm font-medium text-primary">
                  Didn&apos;t receive code? Resend
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity className="mt-3 p-2" onPress={onClose}>
              <Text className="text-sm text-gray-500 underline">Wrong phone number?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default CodeModal;
