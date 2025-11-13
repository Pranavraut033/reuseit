import React from 'react';
import { FlatList, RefreshControlProps } from 'react-native';
import PostItem from './PostItem';
import { Post } from '~/gql/feeds/getPosts';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface PostListProps {
  posts: Post[];
  refreshControl?: React.ReactElement<RefreshControlProps>;
  onSwipeRefresh?: () => void;
}

const PostList: React.FC<PostListProps> = ({ posts, refreshControl, onSwipeRefresh }) => (
  <GestureHandlerRootView>
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PostItem post={item} onSwipeRefresh={onSwipeRefresh} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={refreshControl}
    />
  </GestureHandlerRootView>
);

export default PostList;
