import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getFragmentData } from '~/__generated__';
import { GetPostsQuery, PostFilterInput, PostFilterType } from '~/__generated__/graphql';
import { Button } from '~/components/common/Button';
import ScreenContainer from '~/components/common/ScreenContainer';
import PostList from '~/components/post/PostList';
import { LOCATION_FIELDS, POST_FIELDS } from '~/gql/fragments';
import { GET_POSTS } from '~/gql/posts';
import { useUserLocation } from '~/hooks/useUserLocation';
import { t } from '~/utils/i18n';

const filters = [
  { key: PostFilterType.All, label: t('posts.filters.all') },
  { key: PostFilterType.Giveaway, label: t('posts.filters.giveAway') },
  { key: PostFilterType.Requests, label: t('posts.filters.requests') },
  { key: PostFilterType.Nearby, label: t('posts.filters.nearby') },
];

const FeedsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [postFilterType, setPostFilterType] = useState<PostFilterType>(PostFilterType.All);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  const { location: userLocation } = useUserLocation();

  // Create post filter object based on selected type
  // debounce search input to avoid spamming the server on every keystroke
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(id);
  }, [searchQuery]);

  const postFilter = useMemo(
    (): PostFilterInput => ({
      type: postFilterType,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(postFilterType === PostFilterType.Nearby &&
        userLocation && {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radiusInKm: 0.5, // 0.5km radius for nearby posts
        }),
    }),
    [postFilterType, userLocation, debouncedSearch],
  );

  const { data, loading, error, refetch, fetchMore } = useQuery<GetPostsQuery>(GET_POSTS, {
    variables: { limit, offset: 0, postFilter },
    fetchPolicy: 'cache-and-network',
  });

  // When filters change (including debounced search), reset pagination and refetch
  useEffect(() => {
    setOffset(0);
    refetch({ limit, offset: 0, postFilter });
  }, [postFilter, refetch]);

  const onRefresh = useCallback(async () => {
    setOffset(0);
    await refetch({ limit, offset: 0, postFilter });
  }, [refetch, postFilter]);

  const loadMore = useCallback(async () => {
    if (loading) return;
    const newOffset = offset + limit;
    setOffset(newOffset);
    await fetchMore({
      variables: { limit, offset: newOffset, postFilter },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          ...prev,
          posts: [...(prev.posts || []), ...(fetchMoreResult.posts || [])],
        };
      },
    });
  }, [loading, offset, fetchMore, postFilter]);

  const posts = (data?.posts ?? []).map((_post) => {
    let post = getFragmentData(POST_FIELDS, _post);
    return {
      ...post,
      location: post.location ? getFragmentData(LOCATION_FIELDS, post.location) : null,
    };
  });

  return (
    <ScreenContainer
      header={
        <View className="p-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-gray-800">{t('posts.latest')}</Text>
          </View>
          <View className="mb-4 flex-row items-center">
            <View className="mr-2 flex-1 flex-row items-center rounded-full bg-gray-100 px-4 py-2">
              <Ionicons name="search" size={20} color="#6B7280" />
              <TextInput
                className="ml-2 flex-1 text-gray-700"
                placeholder={t('posts.searchPlaceholder')}
                value={searchQuery}
                onChangeText={setSearchQuery}
                accessibilityLabel="Search posts"
              />
            </View>
          </View>
          <View className="flex-row gap-2">
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                onPress={() => {
                  setPostFilterType(filter.key);
                  setOffset(0); // Reset pagination when changing filters
                }}
                className={`rounded-full px-4 py-2 ${
                  postFilterType === filter.key ? 'bg-green-500' : 'bg-gray-200'
                }`}>
                <Text
                  className={`text-sm font-medium ${
                    postFilterType === filter.key ? 'text-white' : 'text-gray-700'
                  }`}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      }>
      {!posts.length && loading && (
        <View className="items-center justify-center py-12">
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="mt-4 text-gray-600">{t('posts.loading')}</Text>
        </View>
      )}

      {posts.length ? (
        <PostList
          posts={posts}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
          onSwipeRefresh={() => refetch()}
          onEndReached={loadMore}
        />
      ) : (
        !loading &&
        !error && (
          <View className="items-center justify-center py-12">
            <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
            <Text className="mt-4 text-gray-600">{t('posts.noPosts')}</Text>
          </View>
        )
      )}

      {error && (
        <>
          <View className="mb-4 flex flex-row items-center rounded-xl bg-red-50 p-6">
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <View className="ml-4">
              <Text className="text-center text-lg font-medium text-red-700">
                Oops! Something went wrong
              </Text>
              <Text className="mt-2 text-center text-sm text-red-600">
                Failed to load posts. Please try again.
              </Text>
            </View>
          </View>
          <Button onPress={() => refetch()} className="mx-auto mb-4 rounded-full bg-red-600 px-12">
            <Text className="text-white" onPress={() => refetch()}>
              Retry
            </Text>
          </Button>
        </>
      )}
    </ScreenContainer>
  );
};

export default FeedsScreen;
