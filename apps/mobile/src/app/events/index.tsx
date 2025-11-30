import { useQuery } from '@apollo/client/react';
import { router } from 'expo-router';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import ScreenContainer from '~/components/common/ScreenContainer';
import { GET_UPCOMING_EVENTS } from '~/gql/events';
import { Event } from '~/gql/fragments';

const EventListItem = ({ event }: { event: Event }) => {
  const startDate = new Date(event.startTime);
  const formattedDate = startDate.toLocaleDateString();
  const formattedTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity
      className="mb-4 rounded-lg bg-white p-4 shadow-sm"
      onPress={() => (router.push as any)(`/events/${event.id}`)}>
      <Text className="text-lg font-semibold text-gray-900">{event.title}</Text>
      <Text className="mt-1 text-sm text-gray-600">{event.description}</Text>
      <View className="mt-2 flex-row items-center">
        <Text className="text-sm text-gray-500">
          {formattedDate} at {formattedTime}
        </Text>
      </View>
      {event.location && (
        <Text className="mt-1 text-sm text-gray-500">
          {event.location?.street}, {event.location?.city}
        </Text>
      )}
      <Text className="mt-2 text-sm text-blue-600">
        {event.participants.length || 0} participants
      </Text>
    </TouchableOpacity>
  );
};

export default function EventsScreen() {
  const { data, loading, error, refetch } = useQuery(GET_UPCOMING_EVENTS);

  if (loading) {
    return (
      <ScreenContainer>
        <Text className="text-center text-gray-500">Loading events...</Text>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <Text className="text-center text-red-500">Error loading events</Text>
        <TouchableOpacity
          className="mt-4 rounded-lg bg-blue-500 px-4 py-2"
          onPress={() => refetch()}>
          <Text className="text-white">Retry</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const events = (data as any)?.upcomingEvents || [];

  return (
    <ScreenContainer>
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-900">Upcoming Events</Text>
        <TouchableOpacity
          className="rounded-lg bg-green-500 px-4 py-2"
          onPress={() => (router.push as any)('/events/create')}>
          <Text className="text-white">Create Event</Text>
        </TouchableOpacity>
      </View>

      {events.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-center text-gray-500">No upcoming events</Text>
          <TouchableOpacity
            className="mt-4 rounded-lg bg-green-500 px-4 py-2"
            onPress={() => (router.push as any)('/events/create')}>
            <Text className="text-white">Create First Event</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventListItem event={item} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}
