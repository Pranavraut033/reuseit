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
import {
  CREATE_CHAT,
  CREATE_CHAT_MESSAGE,
  GET_CHAT_BY_POST_AND_USER,
  GET_POST_BY_ID,
} from '~/gql/posts';

export default function PostDetail() {
  // Get post ID from route params
  const { id: postId } = useLocalSearchParams<{ id: string }>();

  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');

  // Find the post from the posts query
  const { data, loading: postsLoading } = useQuery(GET_POST_BY_ID, {
    variables: { id: postId },
  });

  let a = getFragmentData(POST_FIELDS, data?.post);
  const post = a
    ? {
        ...a,
        id: a.id ?? '',
        location: a.location ? getFragmentData(LOCATION_FIELDS, a.location) : null,
      }
    : null;

  // Get chat for this post and current user
  const {
    data: chatData,
    loading: chatLoading,
    refetch: refetchChat,
  } = useQuery(GET_CHAT_BY_POST_AND_USER, {
    variables: { postId: postId },
    skip: !postId || !user,
  });

  const [createChat, { loading: creatingChat }] = useMutation(CREATE_CHAT);
  const [createChatMessage, { loading: creatingMessage }] = useMutation(CREATE_CHAT_MESSAGE);

  const handleCreateChat = async () => {
    if (!postId) return;

    try {
      await createChat({
        variables: {
          createChatInput: {
            postId: postId,
          },
        },
      });
      refetchChat();
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !chatData?.getChatByPostAndUser?.id) return;

    try {
      await createChatMessage({
        variables: {
          createChatMessageInput: {
            chatId: chatData.getChatByPostAndUser.id,
            content: messageText.trim(),
          },
        },
      });
      setMessageText('');
      refetchChat();
    } catch (error) {
      console.error('Error sending message:', error);
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

  const chat = chatData?.getChatByPostAndUser;
  const messages = chat?.messages || [];
  const isAuthor = user && post.author?.id === user.id;

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

          {/* Chat Section */}
          {isAuthor ? (
            <View className="mb-20 mt-6">
              <TouchableOpacity
                onPress={() => router.navigate('/chat-requests')}
                className="flex-row items-center justify-center py-4"
              >
                <Ionicons name="chatbubble-outline" size={24} color="#3B82F6" />
                <Text className="ml-2 text-lg font-semibold text-blue-600">View Chat Requests</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="mb-20 mt-6">
              <Text className="mb-4 text-lg font-semibold text-gray-800">Chat</Text>

              {chatLoading ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text className="mt-2 text-gray-600">Loading chat...</Text>
                </View>
              ) : !chat ? (
                <View className="items-center py-12">
                  <Ionicons name="chatbubble-outline" size={48} color="#D1D5DB" />
                  <Text className="mt-4 text-gray-500">No chat yet</Text>
                  <Text className="mt-1 text-center text-sm text-gray-400 mb-4">
                    Start a private conversation with the post author
                  </Text>
                  {user && post.author?.id !== user.id && (
                    <TouchableOpacity
                      onPress={handleCreateChat}
                      disabled={creatingChat}
                      className="bg-blue-500 px-6 py-3 rounded-full"
                    >
                      {creatingChat ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-white font-semibold">Start Chat</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <>
                  {/* Warning Message */}
                  <View className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Text className="text-sm text-yellow-800 text-center">
                      ⚠️ Avoid sharing phone numbers, emails, or personal contact details.
                    </Text>
                  </View>

                  {/* Messages */}
                  {messages.map((message) => (
                    <View
                      key={message.id}
                      className={`mb-3 rounded-xl p-3 ${
                        message.sender.id === user?.id ? 'bg-blue-500 ml-12' : 'bg-gray-100 mr-12'
                      }`}
                    >
                      <View className="mb-2 flex-row items-center">
                        {message.sender.avatarUrl && (
                          <Image
                            source={{ uri: message.sender.avatarUrl }}
                            className="mr-2 h-6 w-6 rounded-full"
                          />
                        )}
                        <Text
                          className={`text-sm font-medium ${
                            message.sender.id === user?.id ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {message.sender.name}
                        </Text>
                        <Text
                          className={`ml-2 text-xs ${
                            message.sender.id === user?.id ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {new Date(message.createdAt as DateTime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <Text
                        className={`text-sm leading-5 ${
                          message.sender.id === user?.id ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {message.content}
                      </Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}
        </ScrollView>

        {/* Message Input */}
        {user && chat && (
          <View className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4">
            <View className="flex-row items-center space-x-3">
              <TextInput
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Type a message..."
                className="mr-3 flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm"
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={!messageText.trim() || creatingMessage}
                className={`rounded-full p-2 ${
                  messageText.trim() && !creatingMessage ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                {creatingMessage ? (
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
