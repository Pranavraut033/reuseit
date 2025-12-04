import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

type SubmitButtonProps = {
  title: string;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
  onPress?: () => void;
};

const SubmitButton: React.FC<SubmitButtonProps> = ({
  title,
  loading = false,
  loadingText,
  disabled = false,
  className = 'mt-6 rounded-lg px-6 py-4 bg-green-500',
  onPress,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      className={`${className} ${isDisabled ? 'bg-gray-400' : ''}`}
      onPress={onPress}
      disabled={isDisabled}>
      <Text className="text-center text-lg font-semibold text-white">
        {loading ? loadingText || 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
};

export default SubmitButton;
