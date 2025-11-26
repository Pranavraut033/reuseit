import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_POSTS_KEY = '@reuseit:offline_posts';

export interface OfflinePost {
  id: string;
  data: any;
  timestamp: number;
  images?: string[]; // Local URIs
}

/**
 * Saves a post to offline storage
 * @param post - Post data to save
 * @returns Success status
 */
export const saveOfflinePost = async (
  post: Omit<OfflinePost, 'id' | 'timestamp'>,
): Promise<string> => {
  try {
    const offlinePosts = await getOfflinePosts();
    const newPost: OfflinePost = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...post,
      timestamp: Date.now(),
    };

    offlinePosts.push(newPost);
    await AsyncStorage.setItem(OFFLINE_POSTS_KEY, JSON.stringify(offlinePosts));
    return newPost.id;
  } catch (error) {
    console.error('Error saving offline post:', error);
    throw error;
  }
};

/**
 * Retrieves all offline posts
 * @returns Array of offline posts
 */
export const getOfflinePosts = async (): Promise<OfflinePost[]> => {
  try {
    const postsJson = await AsyncStorage.getItem(OFFLINE_POSTS_KEY);
    return postsJson ? JSON.parse(postsJson) : [];
  } catch (error) {
    console.error('Error getting offline posts:', error);
    return [];
  }
};

/**
 * Removes a post from offline storage
 * @param postId - ID of the post to remove
 * @returns Success status
 */
export const removeOfflinePost = async (postId: string): Promise<boolean> => {
  try {
    const offlinePosts = await getOfflinePosts();
    const filteredPosts = offlinePosts.filter((post) => post.id !== postId);
    await AsyncStorage.setItem(OFFLINE_POSTS_KEY, JSON.stringify(filteredPosts));
    return true;
  } catch (error) {
    console.error('Error removing offline post:', error);
    return false;
  }
};

/**
 * Clears all offline posts
 * @returns Success status
 */
export const clearOfflinePosts = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(OFFLINE_POSTS_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing offline posts:', error);
    return false;
  }
};

/**
 * Gets the count of offline posts
 * @returns Number of offline posts
 */
export const getOfflinePostsCount = async (): Promise<number> => {
  const posts = await getOfflinePosts();
  return posts.length;
};
