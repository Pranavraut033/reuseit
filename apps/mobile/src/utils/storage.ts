import storage from '@react-native-firebase/storage';
import { Platform } from 'react-native';

/**
 * Upload an image to Firebase Storage
 * @param uri - Local file URI
 * @param path - Storage path (e.g., 'posts/user123/image1.jpg')
 * @returns Promise with the download URL
 */
export const uploadImage = async (uri: string, path: string): Promise<string> => {
  try {
    // Create a reference to the file location
    const reference = storage().ref(path);

    // For iOS, we need to handle the file:// prefix
    const fileUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;

    // Upload the file
    await reference.putFile(fileUri);

    // Get the download URL
    const downloadURL = await reference.getDownloadURL();

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};

/**
 * Upload multiple images to Firebase Storage
 * @param uris - Array of local file URIs
 * @param userId - User ID for organizing files
 * @param folder - Folder name (e.g., 'posts', 'profile')
 * @returns Promise with array of download URLs
 */
export const uploadImages = async (
  uris: string[],
  userId: string,
  folder: string = 'posts',
): Promise<string[]> => {
  try {
    const uploadPromises = uris.map((uri, index) => {
      const timestamp = Date.now();
      const extension = uri.split('.').pop() || 'jpg';
      const path = `${folder}/${userId}/${timestamp}_${index}.${extension}`;
      return uploadImage(uri, path);
    });

    const downloadURLs = await Promise.all(uploadPromises);
    return downloadURLs;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw new Error('Failed to upload images');
  }
};

/**
 * Delete an image from Firebase Storage
 * @param url - Download URL of the image
 */
export const deleteImage = async (url: string): Promise<void> => {
  try {
    const reference = storage().refFromURL(url);
    await reference.delete();
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
};

/**
 * Delete multiple images from Firebase Storage
 * @param urls - Array of download URLs
 */
export const deleteImages = async (urls: string[]): Promise<void> => {
  try {
    const deletePromises = urls.map((url) => deleteImage(url));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting images:', error);
    throw new Error('Failed to delete images');
  }
};
