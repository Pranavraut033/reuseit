import { Ionicons } from '@expo/vector-icons';
import {
  ImagePickerResult,
  launchCameraAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
} from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { t } from '~/utils/i18n';
import { compressImage } from '~/utils/imageCompression';

const MAX_IMAGES = 4;

export interface MediaItem {
  id: string;
  uri: string;
  width?: number;
  height?: number;
}

interface MediaPickerProps {
  images: MediaItem[];
  onImagesChange: (images: MediaItem[]) => void;
  maxImages?: number;
  onTagSuggestions?: (imageUris: string[]) => void;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
  images,
  onImagesChange,
  maxImages = MAX_IMAGES,
  onTagSuggestions,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const cameraPermission = await requestCameraPermissionsAsync();
      const libraryPermission = await requestMediaLibraryPermissionsAsync();

      if (cameraPermission.status !== 'granted' || libraryPermission.status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'We need camera and photo library permissions to add images.',
        );
        return false;
      }
    }
    return true;
  };

  const processImage = async (uri: string): Promise<MediaItem> => {
    try {
      const compressed = await compressImage(uri, 0.8);
      return {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uri: compressed.uri,
        width: compressed.width,
        height: compressed.height,
      };
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  };

  const handleImagePicked = async (result: ImagePickerResult) => {
    if (!result.canceled && result.assets) {
      setIsProcessing(true);
      try {
        const newImages: MediaItem[] = [];
        const remainingSlots = maxImages - images.length;
        const imagesToProcess = result.assets.slice(0, remainingSlots);

        for (const asset of imagesToProcess) {
          const processedImage = await processImage(asset.uri);
          newImages.push(processedImage);
        }

        const updatedImages = [...images, ...newImages];
        onImagesChange(updatedImages);

        // Trigger tag suggestions if callback provided
        if (onTagSuggestions && newImages.length > 0) {
          onTagSuggestions(newImages.map((img) => img.uri));
        }

        if (imagesToProcess.length < result.assets.length) {
          Alert.alert(
            'Limit Reached',
            `Maximum ${maxImages} images allowed. Only ${imagesToProcess.length} were added.`,
          );
        }
      } catch (error) {
        console.error('Error processing images:', error);
        Alert.alert('Error', 'Failed to process images. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const pickImageFromCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await launchCameraAsync({
      mediaTypes: ['images'],

      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    await handleImagePicked(result);
  };

  const pickImageFromLibrary = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: maxImages - images.length,
    });

    await handleImagePicked(result);
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      t('postCreate.addPhotos'),
      t('postCreate.photosLimit').replace('4', String(maxImages)),
      [
        {
          text: t('postCreate.takePhoto'),
          onPress: pickImageFromCamera,
        },
        {
          text: t('postCreate.chooseFromLibrary'),
          onPress: pickImageFromLibrary,
        },
        {
          text: t('postCreate.cancel'),
          style: 'cancel',
        },
      ],
    );
  };

  const removeImage = useCallback(
    (id: string) => {
      const updatedImages = images.filter((img) => img.id !== id);
      onImagesChange(updatedImages);
    },
    [images, onImagesChange],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{t('postCreate.addPhotos')}</Text>
        <Text style={styles.headerSubtext}>
          {images.length}/{maxImages} {t('postCreate.photosLimit')}
        </Text>
      </View>

      {images.length > 0 && (
        <View style={styles.imagesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imagesScrollContent}>
            {images.map((item) => (
              <View key={item.id} style={styles.imageContainer}>
                <Image source={{ uri: item.uri }} style={styles.image} resizeMode="cover" />

                {/* Delete button */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeImage(item.id)}
                  accessible={true}
                  accessibilityLabel={t('accessibility.removePhotoButton')}
                  accessibilityRole="button">
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Add Image Button */}
      {images.length < maxImages && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={showImagePickerOptions}
          disabled={isProcessing}
          accessible={true}
          accessibilityLabel={t('accessibility.addPhotoButton')}
          accessibilityRole="button">
          {isProcessing ? (
            <ActivityIndicator color="#3B82F6" size="small" />
          ) : (
            <>
              <Ionicons name="camera" size={32} color="#3B82F6" />
              <Text style={styles.addButtonText}>{t('postCreate.addPhotos')}</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Education Tip */}
      <View style={styles.tipContainer}>
        <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
        <Text style={styles.tipText}>{t('postCreate.tip1')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  imagesWrapper: {
    marginBottom: 12,
  },
  imagesScrollContent: {
    gap: 8,
    paddingVertical: 4,
  },
  gestureContainer: {
    flex: 1,
  },
  imageGrid: {
    gap: 8,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  imageContainerActive: {
    opacity: 0.7,
    transform: [{ scale: 1.05 }],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 2,
  },
  dragHandle: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#3B82F6',
  },
  reorderHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
  },
});
