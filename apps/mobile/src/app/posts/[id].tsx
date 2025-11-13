import React, { useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_POSTS } from '~/gql/feeds/getPosts';
import { GET_COMMENTS_BY_POST, CREATE_COMMENT } from '~/gql/feeds/postMutations';
import { Container } from '~/components/common/Container';
import { useAuth } from '~/context/AuthContext';

export default function PostDetail() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');

  // Find the post from the posts query
  const { data: postsData, loading: postsLoading } = useQuery(GET_POSTS);
  const post = postsData?.posts?.find(p => p.id === id);

  // Get comments for this post
  const { data: commentsData, loading: commentsLoading, refetch: refetchComments } = useQuery(GET_COMMENTS_BY_POST, {
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
      <Container>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading post...</Text>
        </View>
      </Container>
    );
  }

  const comments = commentsData?.commentsByPost || [];

  return (
    <Container>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Post Content */}
          <View className="mb-6 rounded-2xl bg-white p-4 shadow-lg">
            {post.author && (
              <View className="mb-3 flex-row items-center">
                {post.author.avatarUrl && (
                  <Image source={{ uri: post.author.avatarUrl }} className="mr-3 h-12 w-12 rounded-full border-2 border-gray-200" />
                )}
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 text-lg">{post.author.name}</Text>
                  <Text className="text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
            )}

            <Text className="mb-4 text-gray-800 text-base leading-6">{post.content}</Text>

            {post.images && post.images.length > 0 && (
              <View className="mb-4 space-y-2">
                {post.images.map((image, index) => (
                  <View key={index} className="rounded-xl overflow-hidden">
                    <Image
                      source={{ uri: image }}
                      className="h-64 w-full"
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </View>
            )}

            <View className="flex-row items-center space-x-6 pt-3 border-t border-gray-100">
              <View className="flex-row items-center space-x-1">
                <Ionicons name="heart-outline" size={20} color="#6B7280" />
                <Text className="text-gray-600 text-sm">{Math.floor(post.likes)}</Text>
              </View>

              <View className="flex-row items-center space-x-1">
                <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
                <Text className="text-gray-600 text-sm">{comments.length}</Text>
              </View>
            </View>
          </View>

          {/* Comments Section */}
          <View className="mb-20">
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
                <Text className="mt-1 text-center text-sm text-gray-400">Be the first to share your thoughts!</Text>
              </View>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} className="mb-3 rounded-xl bg-gray-50 p-3">
                  <View className="flex-row items-center mb-2">
                    {comment.author?.avatarUrl && (
                      <Image source={{ uri: comment.author.avatarUrl }} className="mr-2 h-8 w-8 rounded-full" />
                    )}
                    <Text className="font-medium text-gray-900 text-sm">{comment.author?.name || 'Anonymous'}</Text>
                    <Text className="ml-2 text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  <Text className="text-gray-700 text-sm leading-5">{comment.content}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        {user && (
          <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
            <View className="flex-row items-center space-x-3">
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Write a comment..."
                className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm"
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
    </Container>
  );
}