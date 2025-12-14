// import { useMutation, useQuery } from '@apollo/client/react';
// import { Ionicons } from '@expo/vector-icons';
// import { router, useLocalSearchParams } from 'expo-router';
// import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
// import { Toast } from 'toastify-react-native';

import { Text, View } from 'react-native';

import ScreenContainer from '~/components/common/ScreenContainer';
// import { useAuth } from '~/context/AuthContext';
// import { GET_EVENT } from '~/gql/events';
// import { JOIN_EVENT, LEAVE_EVENT } from '~/gql/events/mutations';
// import { Event } from '~/gql/fragments';

// type EventDetail = Omit<Event, 'posts'> & {
//   posts?: {
//     id: string;
//     title: string;
//     description: string;
//     images: string[];
//     createdAt: string;
//     author: {
//       id: string;
//       name: string;
//       avatarUrl?: string;
//     };
//   }[];
// };

export default function EventDetailScreen() {
  // COPILOT_HIDE_EVENTS_START - Remove this block to re-enable event details
  return (
    <ScreenContainer>
      <View className="flex-1 items-center justify-center px-6">
        <View className="items-center">
          <Text className="mb-4 text-6xl">📅</Text>
          <Text className="mb-2 text-2xl font-bold text-gray-900">Event Details</Text>
          <Text className="text-center text-lg text-gray-600">
            Coming Soon! Event details will be available here.
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
  // COPILOT_HIDE_EVENTS_END

  // Original event detail code below - uncomment to restore
  /*
  const { id } = useLocalSearchParams();
  const { user } = useAuth();

  const eventId = Array.isArray(id) ? id[0] : id;

  const { data, loading, error, refetch } = useQuery(GET_EVENT, {
    variables: { id: eventId },
    skip: !eventId,
  });

  const [joinEvent, { loading: joining }] = useMutation(JOIN_EVENT, {
    onCompleted: () => refetch(),
    onError: (error) => {
      Toast.error(error.message);
    },
  });

  const [leaveEvent, { loading: leaving }] = useMutation(LEAVE_EVENT, {
    onCompleted: () => refetch(),
    onError: (error) => {
      Toast.error(error.message);
    },
  });

  if (loading) {
    return (
      <ScreenContainer>
        <Text className="text-center text-gray-500">Loading event...</Text>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <Text className="text-center text-red-500">Error loading event</Text>
        <TouchableOpacity
          className="mt-4 rounded-lg bg-blue-500 px-4 py-2"
          onPress={() => refetch()}>
          <Text className="text-white">Retry</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const event = (data as any)?.event as EventDetail;

  if (!event) {
    return (
      <ScreenContainer>
        <Text className="text-center text-gray-500">Event not found</Text>
      </ScreenContainer>
    );
  }

  const startDate = new Date(event.startTime);
  const endDate = event.endTime ? new Date(event.endTime) : null;
  const isCreator = user?.id === event.creator.id;
  const isParticipant = event.participants?.some((p) => p.user.id === user?.id);

  const handleRSVP = () => {
    if (isParticipant) {
      leaveEvent({ variables: { eventId: event.id } });
    } else {
      joinEvent({ variables: { eventId: event.id } });
    }
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-6 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          {isCreator && (
            <TouchableOpacity
              className="rounded-lg bg-blue-500 px-4 py-2"
              onPress={() => (router.push as any)(`/events/${event.id}/edit`)}>
              <Text className="text-white">Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {event.imageUrl?.[0] && (
          <View className="mb-4 h-48 rounded-lg bg-gray-200">
            <Text className="text-center text-gray-500">Event Image</Text>
          </View>
        )}

        <Text className="mb-2 text-2xl font-bold text-gray-900">{event.title}</Text>

        {event.description && <Text className="mb-4 text-gray-600">{event.description}</Text>}

        <View className="mb-6 rounded-lg bg-gray-50 p-4">
          <View className="mb-3 flex-row items-center">
            <Ionicons name="calendar" size={20} color="#6B7280" />
            <Text className="ml-2 text-gray-700">
              {startDate.toLocaleDateString()} at{' '}
              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {endDate &&
                ` - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </Text>
          </View>

          <View className="mb-3 flex-row items-center">
            <Ionicons name="location" size={20} color="#6B7280" />
            <Text className="ml-2 text-gray-700">
              {event.location?.street}
              {event.location?.city && `, ${event.location.city}`}
              {event.location?.country && `, ${event.location.country}`}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Ionicons name="person" size={20} color="#6B7280" />
            <Text className="ml-2 text-gray-700">Organized by {event.creator.name}</Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-gray-900">
            Participants ({event.participants?.length || 0})
          </Text>
          {event.participants && event.participants.length > 0 ? (
            <View className="flex-row flex-wrap">
              {event.participants.slice(0, 10).map((participant) => (
                <View key={participant.id} className="mb-2 mr-2 rounded-full bg-blue-100 px-3 py-1">
                  <Text className="text-sm text-blue-800">{participant.user.name}</Text>
                </View>
              ))}
              {event.participants.length > 10 && (
                <Text className="text-sm text-gray-500">
                  +{event.participants.length - 10} more
                </Text>
              )}
            </View>
          ) : (
            <Text className="text-gray-500">No participants yet</Text>
          )}
        </View>

        {!isCreator && (
          <TouchableOpacity
            className={`mb-6 rounded-lg px-6 py-3 ${isParticipant ? 'bg-red-500' : 'bg-green-500'}`}
            onPress={handleRSVP}
            disabled={joining || leaving}>
            <Text className="text-center text-white">
              {joining || leaving ? 'Processing...' : isParticipant ? 'Leave Event' : 'Join Event'}
            </Text>
          </TouchableOpacity>
        )}

        {event.posts && event.posts.length > 0 && (
          <View>
            <Text className="mb-3 text-lg font-semibold text-gray-900">
              Related Posts ({event.posts.length})
            </Text>
            {event.posts.map((post) => (
              <TouchableOpacity
                key={post.id}
                className="mb-3 rounded-lg bg-white p-4 shadow-sm"
                onPress={() => (router.push as any)(`/posts/${post.id}`)}>
                <Text className="font-semibold text-gray-900">{post.title}</Text>
                <Text className="mt-1 text-sm text-gray-600" numberOfLines={2}>
                  {post.description}
                </Text>
                <Text className="mt-2 text-xs text-gray-500">
                  by {post.author.name} • {new Date(post.createdAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
  */
}
