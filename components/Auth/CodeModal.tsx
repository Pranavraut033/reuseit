import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import Field from '../common/Field';
import { Button } from '../common/Button';

const CodeModal: React.FC<{
  visible: boolean;
  onClose?: () => void;
  onSubmit?: () => void;
}> = ({ visible, onClose, onSubmit }) => {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="fade">
      <TouchableOpacity
        className="flex-1 items-center justify-center bg-black/50"
        activeOpacity={1}>
        <View className="w-full flex-1 items-center justify-center">
          <TouchableOpacity
            activeOpacity={1}
            className="w-11/12 items-center rounded-3xl bg-white p-6 shadow-lg">
            <Text className="mb-2 text-lg font-semibold text-gray-900">Enter OTP</Text>
            <Text className="mb-4 text-center text-gray-500">
              Please enter the 6-digit code sent to your phone.
            </Text>
            <Field name="code" rules={{ required: 'Please enter the code' }}>
              {({ value, onChange }) => (
                <TextInput
                  className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-xl tracking-widest focus:border-primary"
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
              className="w-full rounded-lg bg-primary py-3"
              onPress={() => onSubmit?.()}
            />
            <TouchableOpacity className="mt-4" onPress={onClose}>
              <Text className="text-sm text-primary">Wrong phone number?</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default CodeModal;
