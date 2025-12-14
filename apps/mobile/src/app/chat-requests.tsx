import { useMutation, useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Toast } from 'toastify-react-native';

import ScreenContainer from '~/components/common/ScreenContainer';
import { useAuth } from '~/context/AuthContext';
import { BLOCK_USER, DELETE_CHAT, GET_CHATS_FOR_USER, REPORT_CHAT } from '~/gql/posts';

export default function ChatRequestsScreen() {
  const { user } = useAuth();
  const [reportingChatId, setReportingChatId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  const { data, loading, refetch } = useQuery(GET_CHATS_FOR_USER, {
    skip: !user,
  });

  const [blockUser] = useMutation(BLOCK_USER);
  const [deleteChat] = useMutation(DELETE_CHAT);
  const [reportChat] = useMutation(REPORT_CHAT);

  const chats = data?.getChatsForUser || [];

  // Filter chats where current user is the author
  const authorChats = chats.filter((chat) => chat.author.id === user?.id);

  const handleBlockUser = async (userId: string, userName: string) => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${userName}? This will prevent them from requesting items from your future posts.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser({
                variables: { blockUserInput: { userId } },
              });
              Toast.success(`${userName} has been blocked.`);
              refetch();
            } catch (_error) {
              Toast.error('Failed to block user.');
            }
          },
        },
      ],
    );
  };

  const handleDeleteChat = async (chatId: string) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChat({
                variables: { chatId },
              });
              Toast.success('Chat has been deleted.');
              refetch();
            } catch (_error) {
              Toast.error('Failed to delete chat.');
            }
          },
        },
      ],
    );
  };

  const handleReportChat = async (chatId: string) => {
    if (!reportReason.trim()) {
      Toast.error('Please provide a reason for reporting.');
      return;
    }

    try {
      await reportChat({
        variables: {
          reportChatInput: {
            chatId,
            reason: reportReason.trim(),
          },
        },
      });
      Toast.success('Chat has been reported.');
      setReportingChatId(null);
      setReportReason('');
      refetch();
    } catch (_error) {
      Toast.error('Failed to report chat.');
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading chat requests...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="mb-4 flex-row items-center justify-between border-b border-gray-200 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-xl font-bold text-gray-800">Chat Requests</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {authorChats.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
            <Text className="mt-4 text-gray-500">No chat requests yet</Text>
            <Text className="mt-1 text-center text-sm text-gray-400">
              When people request your items, they&apos;ll appear here
            </Text>
          </View>
        ) : (
          authorChats.map((chat) => (
            <View key={chat.id} className="mb-4 rounded-xl bg-white p-4 shadow-sm">
              {/* Post Info */}
              <View className="mb-3 flex-row items-center">
                {chat.post.images?.[0] && (
                  <View className="mr-3 h-12 w-12 overflow-hidden rounded-lg">
                    <Text className="text-xs text-gray-500">Post Image</Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800" numberOfLines={1}>
                    {chat.post.title}
                  </Text>
                  <Text className="text-sm text-gray-500">Requested by {chat.requester.name}</Text>
                </View>
              </View>

              {/* Last Message Preview */}
              {chat.messages?.[0] && (
                <View className="mb-3 rounded-lg bg-gray-50 p-3">
                  <Text className="text-sm text-gray-700" numberOfLines={2}>
                    {chat.messages[0].content}
                  </Text>
                  <Text className="mt-1 text-xs text-gray-500">
                    {new Date(chat.messages[0].createdAt).toLocaleDateString()}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => router.push(`/posts/${chat.post.id}`)}
                  className="flex-1 rounded-lg bg-blue-500 py-2"
                >
                  <Text className="text-center text-sm font-medium text-white">View Chat</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleBlockUser(chat.requester.id, chat.requester.name)}
                  className="rounded-lg bg-red-500 px-3 py-2"
                >
                  <Ionicons name="ban" size={16} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDeleteChat(chat.id)}
                  className="rounded-lg bg-gray-500 px-3 py-2"
                >
                  <Ionicons name="trash" size={16} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setReportingChatId(chat.id)}
                  className="rounded-lg bg-yellow-500 px-3 py-2"
                >
                  <Ionicons name="flag" size={16} color="white" />
                </TouchableOpacity>
              </View>

              {/* Report Form */}
              {reportingChatId === chat.id && (
                <View className="mt-3 rounded-lg bg-yellow-50 p-3">
                  <Text className="mb-2 text-sm font-medium text-yellow-800">Report this chat</Text>
                  <TextInput
                    value={reportReason}
                    onChangeText={setReportReason}
                    placeholder="Reason for reporting..."
                    className="mb-2 rounded border border-yellow-200 p-2 text-sm"
                    multiline
                    numberOfLines={2}
                  />
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => handleReportChat(chat.id)}
                      className="flex-1 rounded bg-yellow-500 py-2"
                    >
                      <Text className="text-center text-sm font-medium text-white">Report</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setReportingChatId(null);
                        setReportReason('');
                      }}
                      className="rounded bg-gray-300 px-3 py-2"
                    >
                      <Text className="text-sm text-gray-700">Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
