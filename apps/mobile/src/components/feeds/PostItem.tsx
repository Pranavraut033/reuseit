import { useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Row from '~/components/common/SpaceHelper';
import { Post } from '~/gql/feeds/getPosts';
import { LIKE_POST } from '~/gql/feeds/likePost';

interface PostItemProps {
  post: Post;
  onSwipeRefresh?: () => void;
}

const PostItem: React.FC<PostItemProps> = ({ post }) => {
  const [state, setState] = useState<{ likes: number; liked: boolean }>({
    likes: Math.floor(post.likes || 0),
    liked: !!post.likedByCurrentUser,
  });

  const [liking, setLiking] = useState(false);

  const [likePost] = useMutation<any, any>(LIKE_POST);

  const handlePress = () => {
    router.push(`/posts/${post.id}`);
  };

  const toggleLike = useCallback(() => {
    setState((s) => ({ liked: !s.liked, likes: s.liked ? Math.max(0, s.likes - 1) : s.likes + 1 }));
  }, []);

  const handleLike = useCallback(
    async (e: any) => {
      e?.stopPropagation?.();

      if (liking) return;

      setLiking(true);

      try {
        toggleLike();

        await likePost({ variables: { postId: post.id } });
        setState((s) => ({ ...s, liked: !s.liked }));
      } catch (err) {
        toggleLike();
        console.error('Error liking post:', err);
      } finally {
        setLiking(false);
      }
    },
    [liking, likePost, post.id, toggleLike],
  );

  // Image carousel state and handler
  const [activeImage, setActiveImage] = useState(0);
  const imgScrollRef = useRef<ScrollView | null>(null);

  const onMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    return (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const width = e.nativeEvent.layoutMeasurement.width || 1;
      const idx = Math.round(offsetX / width);
      setActiveImage(idx);
    };
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      className="mb-4 rounded-2xl bg-white p-4 shadow-lg border border-gray-100 "
    >
      {post.author && (
        <View className="mb-3 flex-row items-center">
          {post.author.avatarUrl && (
            <View className="mr-3 relative">
              <Image
                source={{ uri: post.author.avatarUrl }}
                className="h-10 w-10 rounded-full border-2 border-gray-200"
              />
              {/* small badge */}
              <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
            </View>
          )}
          <View className="flex-1">
            <Text className="font-semibold text-gray-900 text-base">{post.author.name}</Text>
            <Text className="text-xs text-gray-500">
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      )}

      <Text className="mb-3 text-gray-800 text-base leading-6">{post.content}</Text>

      {post.images && post.images.length > 0 && (
        <View className="mb-3 rounded-xl overflow-hidden bg-gray-50">
          {post.images.length === 1 ? (
            <Image source={{ uri: post.images[0] }} className="h-56 w-full" resizeMode="cover" />
          ) : (
            <View>
              <ScrollView
                className="h-56 w-full bg-black/20"
                ref={(r) => {
                  imgScrollRef.current = r;
                }}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onMomentumScrollEnd}
              >
                {post.images.map((img, idx) => (
                  <Image
                    key={idx}
                    source={{ uri: img }}
                    className="h-56 w-full"
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>

              {/* Dots */}
              <View className="absolute bottom-3 left-0 right-0 items-center">
                <Row className="bg-transparent px-2 py-1 rounded-full" space={8}>
                  {post.images.map((_, i) => (
                    <View
                      key={i}
                      className={`${i === activeImage ? 'bg-white' : 'bg-white/60'} h-2 w-6 rounded-full`}
                    />
                  ))}
                </Row>
              </View>
            </View>
          )}
        </View>
      )}

      <View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
        <Row className="items-center" space={16}>
          <TouchableOpacity onPress={handleLike} className="items-center">
            <Row space={4}>
              <Ionicons
                name={state.liked || liking ? 'heart' : 'heart-outline'}
                size={20}
                color={state.liked || liking ? '#EF4444' : '#6B7280'}
              />
              <Text className="text-gray-600 text-sm">{state.likes}</Text>
            </Row>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/posts/${post.id}`);
            }}
            className="items-center"
          >
            <Row space={4}>
              <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
              <Text className="text-gray-600 text-sm">{post.comments.length}</Text>
            </Row>
          </TouchableOpacity>
        </Row>

        <TouchableOpacity onPress={(e) => e.stopPropagation()}>
          <Ionicons name="share-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default PostItem;
