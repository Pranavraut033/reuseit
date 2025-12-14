import { useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import AvatarIcon from '~/components/common/AvatarIcon';
import { Post } from '~/gql/fragments';
import { DateTime } from '~/gql/helper.types';
import { CREATE_CHAT, TOGGLE_LIKE_POST } from '~/gql/posts';
import useMounted from '~/hooks/useMounted';
import { useUserLocation } from '~/hooks/useUserLocation';
import { useStore } from '~/store';
import { computeGeographicalDistance } from '~/utils';
import { PostCreateFormData } from '~/utils/postValidation';

type BasePostCardProps = {
  userName?: string;
  disableLink?: boolean;
};

type PreviewPostCardProps = BasePostCardProps & {
  isPreview: true;
  post?: never; // not allowed
  formData: Partial<PostCreateFormData>;
  images?: string[];
};

type NormalPostCardProps = BasePostCardProps & {
  isPreview?: false;
  post: Post;
  formData?: never; // not allowed
  images?: never; // not allowed
};

export type PostCardProps = PreviewPostCardProps | NormalPostCardProps;

export const PostCard: React.FC<PostCardProps> = ({
  formData,
  post,
  images,
  userName: _u = 'User',
  isPreview = false,
  disableLink = false,
}) => {
  const {
    title,
    description,
    category,
    condition,
    tags,
    location,
    pickupDate,
    anonymous,
    postType,
  } = (isPreview ? formData : post) || {};

  const { location: userLocation, fetchUserLocation } = useUserLocation();
  const signInUser = useStore((state) => state.user);
  const user = post?.author ?? signInUser;
  const userName = user?.name || _u;
  const imagesList = images ?? post?.images ?? [];

  const hasContent = description || imagesList.length > 0;

  useMounted(() => {
    fetchUserLocation(true);
  });

  const distance = useMemo(() => {
    if (!location?.coordinates || !userLocation?.latitude || !userLocation?.longitude) return '';

    const distance = computeGeographicalDistance(
      location.coordinates[1],
      location.coordinates[0],
      userLocation.latitude,
      userLocation.longitude,
    );

    return distance < 0.5 ? 'Nearby' : `${Math.round(distance * 1000)} m away`;
  }, [location?.coordinates, userLocation?.latitude, userLocation?.longitude]);

  const onPostPress = useCallback(() => {
    if (post) {
      router.navigate(`/posts/${post.id}`);
    }
  }, [post]);

  if (!hasContent && isPreview) {
    return (
      <View>
        <View className="items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-10">
          <Ionicons name="eye-outline" size={48} color="#D1D5DB" />
          <Text className="mt-3 text-sm text-gray-400">Start adding content to see preview</Text>
        </View>
      </View>
    );
  }

  const RootComponent = disableLink ? View : TouchableOpacity;

  return (
    <RootComponent onPress={disableLink ? undefined : onPostPress} activeOpacity={0.8}>
      <View className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg">
        {/* User Info */}
        <View className="flex-row items-center gap-3 p-3">
          <AvatarIcon user={user} size={40} anonymous={anonymous} />
          <View className="flex-1">
            <Text className="text-[15px] font-semibold text-gray-800">
              {anonymous ? 'Anonymous' : userName}
            </Text>
            <Text className="text-xs text-gray-400">
              {post?.createdAt
                ? format(new Date(post.createdAt as string | number | Date), 'PPPp')
                : 'Just now'}
            </Text>
          </View>
          {/* Eco Badge */}
          {/* {user && (
            <View className="flex-row items-center gap-1 rounded-full bg-green-100 px-2 py-1">
              <Ionicons name="leaf" size={12} color="#059669" />
              <Text className="text-xs font-medium text-green-700">Eco User</Text>
            </View>
          )} */}
        </View>

        {/* Images Preview */}
        {imagesList.length > 0 && (
          <View className="relative h-[300px] w-full">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled>
              {imagesList.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  className="h-[300px] w-[300px]"
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {imagesList.length > 1 && (
              <View className="absolute right-3 top-3 flex-row items-center gap-1 rounded-xl bg-black/60 px-2 py-1">
                <Ionicons name="images" size={14} color="#FFF" />
                <Text className="text-xs font-semibold text-white">{imagesList.length}</Text>
              </View>
            )}
          </View>
        )}

        {/* Content */}
        <View className="p-3">
          {title && (
            <Text className="mb-2 text-lg font-bold text-gray-800" numberOfLines={2}>
              {title}
            </Text>
          )}

          {description && (
            <Text className="mb-3 text-[15px] leading-[22px] text-gray-600" numberOfLines={3}>
              {description}
            </Text>
          )}

          {/* Metadata */}
          <View className="mb-3 flex-row flex-wrap gap-3">
            {category && (
              <View className="flex-row items-center gap-1">
                <Ionicons name="grid-outline" size={14} color="#6B7280" />
                <Text className="text-[13px] text-gray-500">{category}</Text>
              </View>
            )}

            {condition && (
              <View className="flex-row items-center gap-1">
                <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
                <Text className="text-[13px] text-gray-500">{condition}</Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-1.5 py-1 mb-3"
            >
              {tags.map((tag, index) => (
                <View key={index} className="rounded-xl bg-green-50 px-2.5 py-1">
                  <Text className="text-xs font-medium text-green-600">#{tag}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Location & Pickup Date */}
          {(location || pickupDate) && (
            <View className="gap-2 border-t border-gray-100 pt-2">
              {location && (
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="location-outline" size={16} color="#6B7280" />
                  <Text className="flex-1 text-[13px] text-gray-500" numberOfLines={1}>
                    {location.street || 'Location set'}
                    {distance ? ' • ' + distance : ''}
                  </Text>
                </View>
              )}

              {pickupDate && (
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text className="text-[13px] text-gray-500">
                    {format(new Date(pickupDate as DateTime), 'MMM dd, yyyy')}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Engagement Preview */}
        {isPreview ? (
          <EngagementPreviewSkeleton />
        ) : (
          <EngagementPreview post={post!} postType={postType} />
        )}
      </View>
    </RootComponent>
  );
};

const EngagementPreview: React.FC<{ post: Post; postType?: string }> = ({ post, postType }) => {
  const signInUser = useStore((state) => state.user);
  const [liked, setLiked] = useState(!!post.likedByCurrentUser);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [toggleLikePost, { loading }] = useMutation(TOGGLE_LIKE_POST, {
    variables: { postId: post.id },
    fetchPolicy: 'no-cache',
    onCompleted: () => {
      setLiked(!liked);
      setLikeCount((s) => Math.max(0, s + (liked ? -1 : 1)));
    },
  });

  const onCommentPress = useCallback(() => {
    // Navigate to chat section
    router.navigate(`/posts/${post.id}`);
  }, [post.id]);

  const isAuthor = signInUser?.id === post.author?.id;

  return (
    <EngagementPreviewSkeleton
      likeCount={likeCount}
      chatCount={post.chatCount}
      liked={!!liked}
      hasChat={!!post.hasChatWithCurrentUser}
      onLikePress={() => {
        if (!loading) {
          toggleLikePost();
        }
      }}
      onCommentPress={onCommentPress}
      isLiking={loading}
      postType={postType}
      postId={post.id}
      isAuthor={isAuthor}
    />
  );
};

const EngagementPreviewSkeleton: React.FC<{
  likeCount?: number;
  chatCount?: number;
  liked?: boolean;
  hasChat?: boolean;
  onLikePress?: () => void;
  isLiking?: boolean;
  onCommentPress?: () => void;
  postType?: string;
  postId?: string;
  isAuthor?: boolean;
}> = ({
  likeCount = 0,
  chatCount = 0,
  liked = false,
  hasChat = false,
  onLikePress,
  isLiking,
  onCommentPress,
  postType,
  postId,
  isAuthor = false,
}) => {
  const isGiveaway = postType === 'GIVEAWAY';
  const isRequest = postType === 'REQUESTS';

  const [createChat, { loading: creatingChat }] = useMutation(CREATE_CHAT, {
    variables: { createChatInput: { postId: postId! } },
    onCompleted: () => {
      // Navigate to post detail to see the chat
      router.navigate(`/posts/${postId}`);
    },
  });

  const handleRequestPress = useCallback(() => {
    if (hasChat) {
      // Navigate to existing chat
      router.navigate(`/posts/${postId}`);
    } else {
      // Create new chat
      createChat();
    }
  }, [hasChat, postId, createChat]);

  return (
    <View className="flex-row items-center gap-5 border-t border-gray-100 p-3">
      {!isAuthor && (
        <>
          {isGiveaway ? (
            <TouchableOpacity
              onPress={handleRequestPress}
              disabled={creatingChat}
              accessibilityLabel={hasChat ? 'View request' : 'Request this item'}
              accessibilityRole="button"
            >
              <View
                className={`flex-row items-center gap-1.5 rounded-full px-4 py-2 ${
                  hasChat ? 'bg-gray-500' : 'bg-green-500'
                }`}
              >
                <Ionicons name="hand-left" size={16} color="#FFF" />
                <Text className="text-sm font-medium text-white">
                  {hasChat ? 'Requested' : 'Request'}
                </Text>
              </View>
            </TouchableOpacity>
          ) : isRequest ? (
            <TouchableOpacity
              onPress={handleRequestPress}
              disabled={creatingChat}
              accessibilityLabel={hasChat ? 'View offer' : 'Offer this item'}
              accessibilityRole="button"
            >
              <View
                className={`flex-row items-center gap-1.5 rounded-full px-4 py-2 ${
                  hasChat ? 'bg-gray-500' : 'bg-blue-500'
                }`}
              >
                <Ionicons name="hand-right" size={16} color="#FFF" />
                <Text className="text-sm font-medium text-white">
                  {hasChat ? 'Offered' : 'Offer'}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onLikePress}
              disabled={isLiking}
              accessibilityLabel={liked ? 'Unlike this post' : 'Like this post'}
              accessibilityRole="button"
            >
              <View className="flex-row items-center gap-1.5">
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={liked ? '#10B981' : '#6B7280'}
                />
                <Text className="text-sm" style={{ color: liked ? '#10B981' : '#4B5563' }}>
                  {Math.floor(likeCount)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onCommentPress}
            accessibilityLabel="View chat"
            accessibilityRole="button"
          >
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
              <Text className="text-sm text-gray-600">
                {chatCount > 0
                  ? `${chatCount} ${isRequest ? 'offer' : 'request'}${chatCount > 1 ? 's' : ''}`
                  : 'Chat'}
              </Text>
            </View>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};
