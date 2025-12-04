import { useMutation, useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { yupResolver } from '@hookform/resolvers/yup';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Toast } from 'toastify-react-native';

import ScreenContainer from '~/components/common/ScreenContainer';
import { DateTimeField, LocationField, SubmitButton, TextField } from '~/components/form';
import { useAuth } from '~/context/AuthContext';
import { GET_EVENT } from '~/gql/events';
import { UPDATE_EVENT } from '~/gql/events/mutations';
import { Event } from '~/gql/fragments';
import { EventCreateFormData, eventCreateSchema } from '~/utils/eventValidation';

export default function EditEventScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);

  const { data, loading, error } = useQuery(GET_EVENT, {
    variables: { id: id as string },
    skip: !id,
  });

  const methods = useForm<EventCreateFormData>({
    resolver: yupResolver(eventCreateSchema),
  });
  const { handleSubmit, reset } = methods;

  const [updateEvent] = useMutation(UPDATE_EVENT, {
    onCompleted: (_data: any) => {
      Toast.success('Event updated successfully!');
      router.back();
    },
    onError: (error) => {
      Toast.error(error.message);
      setUpdating(false);
    },
  });

  const event = (data as any)?.event as Event;

  useEffect(() => {
    if (event) {
      const startDate = new Date(event.startTime as string);
      const endDate = event.endTime ? new Date(event.endTime as string) : null;

      reset({
        title: event.title,
        description: event.description || '',
        startTime: startDate,
        endTime: endDate,
        location: event.location
          ? {
              coordinates: [event.location.coordinates[0], event.location.coordinates[1]],
              street: event.location.street || '',
              city: event.location.city || '',
              country: event.location.country || '',
              postalCode: event.location.postalCode || undefined,
              type: event.location.type,
            }
          : undefined,
        imageUrl: event.imageUrl || [],
      });
    }
  }, [event, reset]);

  // Check if user is the creator
  const isCreator = user?.id === event?.creator.id;

  if (loading) {
    return (
      <ScreenContainer>
        <Text className="text-center text-gray-500">Loading event...</Text>
      </ScreenContainer>
    );
  }

  if (error || !event) {
    return (
      <ScreenContainer>
        <Text className="text-center text-red-500">Event not found</Text>
        <TouchableOpacity
          className="mt-4 rounded-lg bg-blue-500 px-4 py-2"
          onPress={() => router.back()}
        >
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  if (!isCreator) {
    return (
      <ScreenContainer>
        <Text className="text-center text-red-500">
          You don&apos;t have permission to edit this event
        </Text>
        <TouchableOpacity
          className="mt-4 rounded-lg bg-blue-500 px-4 py-2"
          onPress={() => router.back()}
        >
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const onSubmit = (formData: EventCreateFormData) => {
    setUpdating(true);

    const startTime = formData.startTime;
    const endTime = formData.endTime;

    if (endTime && startTime >= endTime) {
      Toast.error('End time must be after start time');
      setUpdating(false);
      return;
    }

    if (!formData.location) {
      Toast.error('Location is required');
      setUpdating(false);
      return;
    }

    updateEvent({
      variables: {
        updateEventInput: {
          id: event.id,
          title: formData.title,
          description: formData.description,
          startTime: startTime.toISOString(),
          endTime: endTime?.toISOString(),
          location: {
            street: formData.location.street,
            city: formData.location.city,
            country: formData.location.country,
            coordinates: formData.location.coordinates,
            type: formData.location.type,
          },
        },
      },
    });
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Edit Event</Text>
        </View>

        {/* Form */}
        <FormProvider {...methods}>
          <View className="space-y-4">
            <TextField name="title" label="Event Title *" placeholder="Enter event title" />

            <TextField
              name="description"
              label="Description"
              placeholder="Enter event description"
              multiline
              numberOfLines={4}
            />

            <DateTimeField name="startTime" label="Start Time *" minimumDate={new Date()} />

            <DateTimeField
              name="endTime"
              label="End Time"
              placeholder="Select end time (optional)"
              minimumDate={new Date()}
            />

            <LocationField name="location" />

            <SubmitButton
              title="Update Event"
              loading={updating}
              loadingText="Updating..."
              className="mt-6 rounded-lg px-4 py-3 bg-blue-500"
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </FormProvider>
      </ScrollView>
    </ScreenContainer>
  );
}
