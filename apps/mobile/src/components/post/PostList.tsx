import React from 'react';
import { FlatList, RefreshControlProps, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Post } from '~/gql/fragments';

import { PostCard } from '.';

interface PostListProps {
  posts: Post[];
  refreshControl?: React.ReactElement<RefreshControlProps>;
  onSwipeRefresh?: () => void;
}

const PostList: React.FC<PostListProps> = ({ posts, refreshControl }) => (
  <GestureHandlerRootView>
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="mb-4">
          <PostCard post={item} />
        </View>
      )}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={refreshControl}
    />
  </GestureHandlerRootView>
);

export default PostList;
