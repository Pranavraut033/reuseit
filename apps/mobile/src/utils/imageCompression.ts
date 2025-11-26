import * as ImageManipulator from 'expo-image-manipulator';
import { ImagePickerAsset } from 'expo-image-picker';

export interface CompressedImage {
  uri: string;
  width: number;
  height: number;
  size?: number;
}

const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_HEIGHT = 1920;
const COMPRESSION_QUALITY = 0.8;

/**
 * Compresses an image to reduce file size while maintaining quality
 * @param imageUri - URI of the image to compress
 * @param quality - Compression quality (0-1), default 0.8
 * @returns Compressed image data
 */
export const compressImage = async (
  imageUri: string,
  quality: number = COMPRESSION_QUALITY,
): Promise<CompressedImage> => {
  try {
    // First, get the image dimensions
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: MAX_IMAGE_WIDTH,
            height: MAX_IMAGE_HEIGHT,
          },
        },
      ],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    return {
      uri: manipResult.uri,
      width: manipResult.width,
      height: manipResult.height,
    };
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};

/**
 * Compresses multiple images in parallel
 * @param images - Array of image URIs or ImagePickerAssets
 * @param quality - Compression quality (0-1), default 0.8
 * @returns Array of compressed image data
 */
export const compressImages = async (
  images: (string | ImagePickerAsset)[],
  quality: number = COMPRESSION_QUALITY,
): Promise<CompressedImage[]> => {
  const compressionPromises = images.map((image) => {
    const uri = typeof image === 'string' ? image : image.uri;
    return compressImage(uri, quality);
  });

  return Promise.all(compressionPromises);
};

/**
 * Generates a thumbnail for an image
 * @param imageUri - URI of the image
 * @param size - Thumbnail size (default 200px)
 * @returns Thumbnail image data
 */
export const generateThumbnail = async (
  imageUri: string,
  size: number = 200,
): Promise<CompressedImage> => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: size,
            height: size,
          },
        },
      ],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    return {
      uri: manipResult.uri,
      width: manipResult.width,
      height: manipResult.height,
    };
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
};

/**
 * Calculates the optimal image dimensions while maintaining aspect ratio
 * @param width - Original width
 * @param height - Original height
 * @param maxWidth - Maximum width
 * @param maxHeight - Maximum height
 * @returns Optimal dimensions
 */
export const calculateOptimalDimensions = (
  width: number,
  height: number,
  maxWidth: number = MAX_IMAGE_WIDTH,
  maxHeight: number = MAX_IMAGE_HEIGHT,
): { width: number; height: number } => {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  const aspectRatio = width / height;

  if (width > height) {
    return {
      width: Math.min(width, maxWidth),
      height: Math.min(width, maxWidth) / aspectRatio,
    };
  } else {
    return {
      width: Math.min(height, maxHeight) * aspectRatio,
      height: Math.min(height, maxHeight),
    };
  }
};
