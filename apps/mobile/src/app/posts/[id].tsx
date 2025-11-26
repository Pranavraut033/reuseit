import { useMutation, useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getFragmentData } from '~/__generated__/fragment-masking';
import ScreenContainer from '~/components/common/ScreenContainer';
import { PostCard } from '~/components/post';
import { useAuth } from '~/context/AuthContext';
import { LOCATION_FIELDS, POST_FIELDS } from '~/gql/fragments';
import { DateTime } from '~/gql/helper.types';
import { CREATE_COMMENT, GET_COMMENTS_BY_POST, GET_POST_BY_ID } from '~/gql/posts';

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');

  // Find the post from the posts query
  const { data, loading: postsLoading } = useQuery(GET_POST_BY_ID, {
    variables: { id: id },
  });

  let a = getFragmentData(POST_FIELDS, data?.post);
  const post = a
    ? {
        ...a,
        id: a.id ?? '',
        location: a.location ? getFragmentData(LOCATION_FIELDS, a.location) : null,
      }
    : null;

  // Get comments for this post
  const {
    data: commentsData,
    loading: commentsLoading,
    refetch: refetchComments,
  } = useQuery(GET_COMMENTS_BY_POST, {
    variables: { postId: id as string },
    skip: !id,
  });

  const [createComment, { loading: creatingComment }] = useMutation(CREATE_COMMENT);

  const handleCreateComment = async () => {
    if (!commentText.trim() || !id) return;

    try {
      await createComment({
        variables: {
          createCommentInput: {
            content: commentText.trim(),
            postId: id as string,
          },
        },
      });
      setCommentText('');
      refetchComments();
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  if (postsLoading || !post) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading post...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!post) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Text className="mt-4 text-gray-600">Post not found.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const comments = commentsData?.commentsByPost || [];

  return (
    <ScreenContainer padding={0}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {/* Header */}
        <View className="mb-4 flex-row items-center justify-between border-b border-gray-200 pb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-xl font-bold text-gray-800">Post</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Post Content */}
          <PostCard post={post} disableLink />

          {/* Comments Section */}
          <View className="mb-20 mt-6">
            <Text className="mb-4 text-lg font-semibold text-gray-800">Comments</Text>

            {commentsLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text className="mt-2 text-gray-600">Loading comments...</Text>
              </View>
            ) : comments.length === 0 ? (
              <View className="items-center py-12">
                <Ionicons name="chatbubble-outline" size={48} color="#D1D5DB" />
                <Text className="mt-4 text-gray-500">No comments yet</Text>
                <Text className="mt-1 text-center text-sm text-gray-400">
                  Be the first to share your thoughts!
                </Text>
              </View>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} className="mb-3 rounded-xl bg-gray-50 p-3">
                  <View className="mb-2 flex-row items-center">
                    {comment.author?.avatarUrl && (
                      <Image
                        source={{ uri: comment.author.avatarUrl }}
                        className="mr-2 h-8 w-8 rounded-full"
                      />
                    )}
                    <Text className="text-sm font-medium text-gray-900">
                      {comment.author?.name || 'Anonymous'}
                    </Text>
                    <Text className="ml-2 text-xs text-gray-500">
                      {new Date(comment.createdAt as DateTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text className="text-sm leading-5 text-gray-700">{comment.content}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        {user && (
          <View className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4">
            <View className="flex-row items-center space-x-3">
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Write a comment..."
                className="mr-3 flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm"
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                onPress={handleCreateComment}
                disabled={!commentText.trim() || creatingComment}
                className={`rounded-full p-2 ${commentText.trim() && !creatingComment ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                {creatingComment ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="send" size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
