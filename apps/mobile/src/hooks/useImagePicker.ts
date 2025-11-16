import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert } from 'react-native';

export interface SelectedImage {
  uri: string;
  width?: number;
  height?: number;
  type?: string;
}

export const useImagePicker = () => {
  const [images, setImages] = useState<SelectedImage[]>([]);

  const requestPermissions = async (type: 'camera' | 'library') => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.', [
          { text: 'OK' },
        ]);
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Photo library permission is required to select images.',
          [{ text: 'OK' }],
        );
        return false;
      }
    }
    return true;
  };

  const pickFromCamera = async () => {
    const hasPermission = await requestPermissions('camera');
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImage: SelectedImage = {
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height,
        };
        setImages((prev) => [...prev, newImage]);
      }
    } catch (error) {
      console.error('Error picking image from camera:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickFromLibrary = async (multiple: boolean = true) => {
    const hasPermission = await requestPermissions('library');
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: multiple,
        allowsEditing: !multiple,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages: SelectedImage[] = result.assets.map((asset) => ({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
        }));
        setImages((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking image from library:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const clearImages = () => {
    setImages([]);
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: pickFromCamera,
        },
        {
          text: 'Choose from Library',
          onPress: () => pickFromLibrary(true),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
  };

  return {
    images,
    setImages,
    pickFromCamera,
    pickFromLibrary,
    removeImage,
    clearImages,
    showImagePickerOptions,
  };
};
