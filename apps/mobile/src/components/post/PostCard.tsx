import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';

import { Post } from '~/gql/fragments';
import { PostCreateFormData } from '~/utils/postValidation';

type PostCardProps = {
  userName?: string;
  userAvatar?: string;
  post?: Post;
  formData?: Partial<PostCreateFormData>;
  images?: string[];
};

export const PostCard: React.FC<PostCardProps> = ({
  formData,
  post,
  images,
  userName: _u = 'User',
  userAvatar,
}) => {
  if (!post && !formData) {
    return null;
  }

  const { title, description, category, condition, tags, location, pickupDate, anonymous } =
    formData || post || {};
  const user = post?.author;
  const userName = user?.name || _u;
  const imagesList = images ?? post?.images ?? [];

  const hasContent = title || description || imagesList.length > 0;

  if (!hasContent) {
    return (
      <View>
        <View className="items-center justify-center p-10 bg-gray-50 rounded-2xl border-2 border-gray-200 border-dashed">
          <Ionicons name="eye-outline" size={48} color="#D1D5DB" />
          <Text className="text-sm text-gray-400 mt-3">Start adding content to see preview</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl overflow-hidden shadow-lg border border-black/10">
      {/* User Info */}
      <View className="flex-row items-center p-3 gap-3">
        <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center overflow-hidden">
          {userAvatar && !anonymous ? (
            <Image source={{ uri: userAvatar }} className="w-full h-full" />
          ) : (
            <Ionicons name="person" size={24} color="#3B82F6" />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-semibold text-gray-800">
            {anonymous ? 'Anonymous' : userName}
          </Text>
          <Text className="text-xs text-gray-400">
            {post?.createdAt ? format(new Date(post.createdAt), 'PPPp') : 'Just now'}
          </Text>
        </View>
      </View>

      {/* Images Preview */}
      {imagesList.length > 0 && (
        <View className="relative w-full h-[300px]">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled>
            {imagesList.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                className="w-[300px] h-[300px]"
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          {imagesList.length > 1 && (
            <View className="absolute top-3 right-3 flex-row items-center gap-1 bg-black/60 px-2 py-1 rounded-xl">
              <Ionicons name="images" size={14} color="#FFF" />
              <Text className="text-xs text-white font-semibold">{imagesList.length}</Text>
            </View>
          )}
        </View>
      )}

      {/* Content */}
      <View className="p-3">
        {title && (
          <Text className="text-lg font-bold text-gray-800 mb-2" numberOfLines={2}>
            {title}
          </Text>
        )}

        {description && (
          <Text className="text-[15px] text-gray-600 leading-[22px] mb-3" numberOfLines={3}>
            {description}
          </Text>
        )}

        {/* Metadata */}
        <View className="flex-row flex-wrap gap-3 mb-3">
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
              <View key={index} className="px-2.5 py-1 bg-blue-50 rounded-xl">
                <Text className="text-xs text-blue-600 font-medium">#{tag}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Location & Pickup Date */}
        {(location || pickupDate) && (
          <View className="gap-2 pt-2 border-t border-gray-100">
            {location && (
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text className="text-[13px] text-gray-500 flex-1" numberOfLines={1}>
                  {location.street || 'Location set'}
                </Text>
              </View>
            )}

            {pickupDate && (
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text className="text-[13px] text-gray-500">
                  {format(new Date(pickupDate), 'MMM dd, yyyy')}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Engagement Preview */}
      <View className="flex-row items-center gap-5 p-3 border-t border-gray-100">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="heart-outline" size={20} color="#6B7280" />
          <Text className="text-sm text-gray-500">0</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
          <Text className="text-sm text-gray-500">0</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="share-outline" size={20} color="#6B7280" />
        </View>
      </View>
    </View>
  );
};
