import React from 'react';
import { Text, View } from 'react-native';

import { MediaItem, MediaPicker } from '../post/MediaPicker';
import Field from './Field';

type MediaFieldProps = {
  name: string;
  label?: string;
  maxImages?: number;
  onTagSuggestions?: (imageUris: string[]) => void;
  className?: string;
  images?: any[];
  onImagesChange?: (images: any[]) => void;
};

const MediaField: React.FC<MediaFieldProps> = ({
  name,
  label = 'Images',
  maxImages = 4,
  onTagSuggestions,
  className,
  images: externalImages,
  onImagesChange: externalOnImagesChange,
}) => {
  return (
    <View className={`mb-4 ${className || ''}`}>
      <Text className="mb-2 text-sm font-medium text-gray-700">{label}</Text>
      <Field name={name}>
        {({ value, onChange }) => {
          const images = externalImages !== undefined ? externalImages : value || [];
          const handleImagesChange =
            externalOnImagesChange !== undefined ? externalOnImagesChange : onChange;

          return (
            <MediaPicker
              images={images}
              onImagesChange={handleImagesChange}
              maxImages={maxImages}
              onTagSuggestions={onTagSuggestions}
            />
          );
        }}
      </Field>
    </View>
  );
};

export { MediaItem };
export default MediaField;
