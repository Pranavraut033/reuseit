import { View, Text, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/context/AuthContext';
import { Container } from '~/components/common/Container';
import { useQuery } from '@apollo/client/react';
import { GET_POSTS } from '~/gql/feeds/getPosts';
import PostList from '~/components/feeds/PostList';
import useAppConfig from '~/hooks/useAppConfig';
import { FabButton } from '~/components/common/FabButton';
import { router } from 'expo-router';
import { useState } from 'react';

const FeedsScreen = () => {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useQuery(GET_POSTS);
  const appConfig = useAppConfig();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  return (
    <Container>
      {/* Latest Posts */}
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-gray-800">Latest Posts</Text>
      </View>

      {loading && (
        <View className="items-center justify-center py-12">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading posts...</Text>
        </View>
      )}

      {error && (
        <View className="rounded-xl bg-red-50 p-6">
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text className="mt-4 text-center text-lg font-medium text-red-700">Oops! Something went wrong</Text>
          <Text className="mt-2 text-center text-sm text-red-600">Failed to load posts. Please try again.</Text>
        </View>
      )}

      {data?.posts && (
        <PostList
          posts={data.posts}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onSwipeRefresh={() => refetch()}
        />
      )}
    </Container>
  );
};

export default FeedsScreen;
