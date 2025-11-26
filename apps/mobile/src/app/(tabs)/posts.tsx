import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native';

import { getFragmentData } from '~/__generated__';
import { GetPostsQuery } from '~/__generated__/graphql';
import ScreenContainer from '~/components/common/ScreenContainer';
import PostList from '~/components/post/PostList';
import { LOCATION_FIELDS, POST_FIELDS } from '~/gql/fragments';
import { GET_POSTS } from '~/gql/posts';

const FeedsScreen = () => {
  const { data, loading, error, refetch } = useQuery<GetPostsQuery>(GET_POSTS);

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);
  const posts = (data?.posts ?? []).map((_post) => {
    let post = getFragmentData(POST_FIELDS, _post);
    return {
      ...post,
      location: post.location ? getFragmentData(LOCATION_FIELDS, post.location) : null,
    };
  });

  return (
    <ScreenContainer padding={0}>
      {/* Latest Posts */}
      <View className="mb-4 flex-row items-center justify-between p-4">
        <Text className="text-xl font-bold text-gray-800">Latest Posts</Text>
      </View>

      {!posts.length && loading && (
        <View className="items-center justify-center py-12">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading posts...</Text>
        </View>
      )}

      {error && (
        <View className="rounded-xl bg-red-50 p-6">
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text className="mt-4 text-center text-lg font-medium text-red-700">
            Oops! Something went wrong
          </Text>
          <Text className="mt-2 text-center text-sm text-red-600">
            Failed to load posts. Please try again.
          </Text>
        </View>
      )}

      {posts.length ? (
        <PostList
          posts={posts}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
          onSwipeRefresh={() => refetch()}
        />
      ) : (
        !loading &&
        !error && (
          <View className="items-center justify-center py-12">
            <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
            <Text className="mt-4 text-gray-600">No posts available.</Text>
          </View>
        )
      )}
    </ScreenContainer>
  );
};

export default FeedsScreen;
