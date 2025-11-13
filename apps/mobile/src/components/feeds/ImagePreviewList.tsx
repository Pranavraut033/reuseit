import React from 'react';
import { View, Image, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SelectedImage } from '~/hooks/useImagePicker';

interface ImagePreviewListProps {
  images: SelectedImage[];
  onRemove: (index: number) => void;
  maxImages?: number;
}

export const ImagePreviewList: React.FC<ImagePreviewListProps> = ({
  images,
  onRemove,
  maxImages = 5,
}) => {
  if (images.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-4"
      contentContainerClassName="gap-3">
      {images.map((image, index) => (
        <View key={index} className="relative">
          <Image source={{ uri: image.uri }} className="h-24 w-24 rounded-lg" resizeMode="cover" />
          <Pressable
            onPress={() => onRemove(index)}
            className="absolute right-2 top-2 h-6 w-6 items-center justify-center rounded-full bg-red-500 shadow-md"
            accessible={true}
            accessibilityLabel={`Remove image ${index + 1}`}
            accessibilityRole="button">
            <Ionicons name="trash" size={16} color="white" />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
};
