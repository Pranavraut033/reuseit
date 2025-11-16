import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable,Text, View } from 'react-native';

interface AddImageButtonProps {
  onPress: () => void;
  disabled?: boolean;
  currentCount?: number;
  maxCount?: number;
}

export const AddImageButton: React.FC<AddImageButtonProps> = ({
  onPress,
  disabled = false,
  currentCount = 0,
  maxCount = 5,
}) => {
  const isMaxReached = currentCount >= maxCount;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isMaxReached}
      className={`flex-row items-center rounded-lg border-2 border-dashed px-4 py-3 ${
        isMaxReached || disabled
          ? 'border-gray-300 bg-gray-50'
          : 'border-blue-300 bg-blue-50 active:bg-blue-100'
      }`}
      accessible={true}
      accessibilityLabel="Add photos"
      accessibilityRole="button"
      accessibilityHint={
        isMaxReached ? `Maximum ${maxCount} images allowed` : 'Select photos from camera or library'
      }>
      <View
        className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${
          isMaxReached || disabled ? 'bg-gray-200' : 'bg-blue-200'
        }`}>
        <Ionicons
          name="image-outline"
          size={24}
          color={isMaxReached || disabled ? '#9CA3AF' : '#3B82F6'}
        />
      </View>
      <View className="flex-1">
        <Text
          className={`font-semibold ${isMaxReached || disabled ? 'text-gray-500' : 'text-blue-700'}`}>
          {isMaxReached ? 'Maximum images reached' : 'Add Photos'}
        </Text>
        <Text className="text-xs text-gray-600">
          {isMaxReached ? `${maxCount}/${maxCount} images` : `${currentCount}/${maxCount} images`}
        </Text>
      </View>
      {!isMaxReached && !disabled && <Ionicons name="chevron-forward" size={20} color="#3B82F6" />}
    </Pressable>
  );
};
