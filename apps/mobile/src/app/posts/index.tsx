import { Ionicons } from '@expo/vector-icons';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Container } from '~/components/common/Container';
import { useAuth } from '~/context/AuthContext';
import { useQuery } from '@apollo/client/react';
import { GET_USER_POSTS } from '~/gql/feeds/getUserPosts';
import PostList from '~/components/feeds/PostList';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { FabButton } from '~/components/common/FabButton';

export default function MyPosts() {
  const { user } = useAuth();

  const { data, loading, error, refetch } = useQuery(GET_USER_POSTS, {
    variables: { authorId: user?.id! },
    skip: !user?.id,
    fetchPolicy: 'cache-and-network',
  });

  const posts = data?.postsByAuthor ?? [];

  return (
    <Container>
      {/* Header */}
      <View className="mb-6 mt-4 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
          accessible={true}
          accessibilityLabel="Go back"
          accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </Pressable>
        <Text className="flex-1 text-2xl font-bold text-gray-800">My Posts</Text>
        <Pressable
          onPress={() => refetch()}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
          accessible={true}
          accessibilityLabel="Refresh posts"
          accessibilityRole="button">
          <Ionicons name="refresh" size={24} color="#374151" />
        </Pressable>
      </View>

      {/* Stats Card */}
      <View className="mb-6 flex-row items-center justify-between rounded-xl bg-white p-4 shadow-sm">
        <View className="flex-1 items-center border-r border-gray-200">
          <Text className="text-2xl font-bold text-blue-600">{posts.length}</Text>
          <Text className="text-sm text-gray-600">Posts</Text>
        </View>
        <View className="flex-1 items-center border-r border-gray-200">
          <Text className="text-2xl font-bold text-green-600">
            {posts.reduce((sum: number, post: any) => sum + (post.likes || 0), 0)}
          </Text>
          <Text className="text-sm text-gray-600">Likes</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-2xl font-bold text-purple-600">
            {posts.reduce((sum: number, post: any) => sum + (post.comments?.length || 0), 0)}
          </Text>
          <Text className="text-sm text-gray-600">Comments</Text>
        </View>
      </View>

      {/* Loading State */}
      {loading && (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-3 text-gray-600">Loading your posts...</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View className="rounded-xl bg-red-50 p-6">
          <View className="items-center">
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text className="mt-3 text-center font-semibold text-red-700">
              Failed to load posts
            </Text>
            <Text className="mt-1 text-center text-sm text-red-600">{error.message}</Text>
          </View>
        </View>
      )}

      {/* Empty State */}
      {!loading && !error && posts.length === 0 && (
        <View className="items-center rounded-xl bg-white p-8 shadow-sm">
          <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
          <Text className="mt-4 text-center text-lg font-semibold text-gray-700">No posts yet</Text>
          <Text className="mt-2 text-center text-sm text-gray-500">
            Start sharing your sustainable journey with the community!
          </Text>
        </View>
      )}

      {/* Posts List */}
      {!loading && !error && posts.length > 0 && (
        <PostList posts={posts} />
      )}

      {/* FAB Button for Create Post */}
      <FabButton
        icon={(props) => (
          <Ionicons name="add" size={props.size || 24} color={props.color || 'white'} />
        )}
        className='absolute bottom-4 right-4'
        size="regular"
        onPress={() => router.push('/posts/create')}
        accessible={true}
        accessibilityLabel="Create new post"
        accessibilityRole="button"
      />
    </Container>
  );
}
