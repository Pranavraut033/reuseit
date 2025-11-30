import { useMutation, useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Toast } from 'toastify-react-native';

import ScreenContainer from '~/components/common/ScreenContainer';
import { LocationPicker } from '~/components/post/LocationPicker';
import { useAuth } from '~/context/AuthContext';
import { GET_EVENT } from '~/gql/events';
import { UPDATE_EVENT } from '~/gql/events/mutations';
import { Event } from '~/gql/fragments';
import { LocationCreateFormData } from '~/gql/helper.types';

type FormData = {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date | null;
  location: LocationCreateFormData | null;
};

export default function EditEventScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const { data, loading, error } = useQuery(GET_EVENT, {
    variables: { id: id as string },
    skip: !id,
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();

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
          : null,
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
          onPress={() => router.back()}>
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
          onPress={() => router.back()}>
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const onSubmit = (formData: FormData) => {
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
            className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Edit Event</Text>
        </View>

        {/* Form */}
        <View className="space-y-4">
          {/* Title */}
          <View>
            <Text className="mb-2 text-sm font-medium text-gray-700">Event Title *</Text>
            <Controller
              control={control}
              rules={{ required: 'Title is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="rounded-lg border border-gray-300 px-4 py-3 text-base"
                  placeholder="Enter event title"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
              name="title"
            />
            {errors.title && (
              <Text className="mt-1 text-sm text-red-500">{errors.title.message}</Text>
            )}
          </View>

          {/* Description */}
          <View>
            <Text className="mb-2 text-sm font-medium text-gray-700">Description</Text>
            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="rounded-lg border border-gray-300 px-4 py-3 text-base"
                  placeholder="Enter event description"
                  multiline
                  numberOfLines={4}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  style={{ height: 100, textAlignVertical: 'top' }}
                />
              )}
              name="description"
            />
          </View>

          {/* Start Time */}
          <View>
            <Text className="mb-2 text-sm font-medium text-gray-700">Start Time *</Text>
            <Controller
              control={control}
              rules={{ required: 'Start time is required' }}
              render={({ field: { onChange, value } }) => (
                <>
                  <TouchableOpacity
                    className="flex-row items-center gap-3 rounded-lg border border-gray-300 px-4 py-3"
                    onPress={() => setShowStartDatePicker(true)}>
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                    <Text className="text-base text-gray-800">
                      {value ? format(value, 'MMM dd, yyyy HH:mm') : 'Select start time'}
                    </Text>
                  </TouchableOpacity>

                  {showStartDatePicker && (
                    <DateTimePicker
                      value={value || new Date()}
                      mode="datetime"
                      minimumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        if (Platform.OS === 'android') {
                          setShowStartDatePicker(false);
                        }
                        if (event.type === 'set' && selectedDate) {
                          onChange(selectedDate);
                        }
                        if (Platform.OS === 'ios' && event.type === 'dismissed') {
                          setShowStartDatePicker(false);
                        }
                      }}
                    />
                  )}
                </>
              )}
              name="startTime"
            />
            {errors.startTime && (
              <Text className="mt-1 text-sm text-red-500">{errors.startTime.message}</Text>
            )}
          </View>

          {/* End Time */}
          <View>
            <Text className="mb-2 text-sm font-medium text-gray-700">End Time</Text>
            <Controller
              control={control}
              render={({ field: { onChange, value } }) => (
                <>
                  <TouchableOpacity
                    className="flex-row items-center gap-3 rounded-lg border border-gray-300 px-4 py-3"
                    onPress={() => setShowEndDatePicker(true)}>
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                    <Text className="text-base text-gray-800">
                      {value ? format(value, 'MMM dd, yyyy HH:mm') : 'Select end time (optional)'}
                    </Text>
                  </TouchableOpacity>

                  {showEndDatePicker && (
                    <DateTimePicker
                      value={value || new Date()}
                      mode="datetime"
                      minimumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        if (Platform.OS === 'android') {
                          setShowEndDatePicker(false);
                        }
                        if (event.type === 'set' && selectedDate) {
                          onChange(selectedDate);
                        }
                        if (Platform.OS === 'ios' && event.type === 'dismissed') {
                          setShowEndDatePicker(false);
                        }
                      }}
                    />
                  )}
                </>
              )}
              name="endTime"
            />
          </View>

          {/* Location */}
          <Controller
            control={control}
            rules={{ required: 'Location is required' }}
            render={({ field: { onChange, value } }) => (
              <LocationPicker location={value} onLocationChange={onChange} />
            )}
            name="location"
          />
          {errors.location && (
            <Text className="mt-1 text-sm text-red-500">{errors.location.message}</Text>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            className={`mt-6 rounded-lg px-4 py-3 ${updating ? 'bg-gray-400' : 'bg-blue-500'}`}
            onPress={handleSubmit(onSubmit)}
            disabled={updating}>
            <Text className="text-center text-lg font-semibold text-white">
              {updating ? 'Updating...' : 'Update Event'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
