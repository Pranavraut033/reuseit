import { useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Toast } from 'toastify-react-native';

import ScreenContainer from '~/components/common/ScreenContainer';
import { LocationPicker } from '~/components/post/LocationPicker';
import { CREATE_EVENT } from '~/gql/events';
import { LocationCreateFormData } from '~/gql/helper.types';

type FormData = {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date | null;
  location: LocationCreateFormData | null;
};

export default function CreateEventScreen() {
  const [creating, setCreating] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      startTime: new Date(),
      endTime: null,
      location: null,
    },
  });

  const [createEvent] = useMutation(CREATE_EVENT, {
    onCompleted: (data: any) => {
      Toast.success('Event created successfully!');
      (router.push as any)(`/events/${data.createEvent.id}`);
    },
    onError: (error) => {
      Toast.error(error.message);
      setCreating(false);
    },
  });

  const onSubmit = (data: FormData) => {
    setCreating(true);

    const startTime = data.startTime;
    const endTime = data.endTime;

    if (endTime && startTime >= endTime) {
      Toast.error('End time must be after start time');
      setCreating(false);
      return;
    }

    if (!data.location) {
      Toast.error('Location is required');
      setCreating(false);
      return;
    }

    createEvent({
      variables: {
        createEventInput: {
          title: data.title,
          description: data.description,
          startTime: startTime.toISOString(),
          endTime: endTime?.toISOString(),
          imageUrl: [], // TODO: Add image upload
          location: {
            street: data.location.street,
            city: data.location.city,
            country: data.location.country,
            coordinates: data.location.coordinates,
            type: data.location.type,
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
          <Text className="text-2xl font-bold text-gray-900">Create Event</Text>
        </View>

        {/* Form */}
        <View className="space-y-4">
          {/* Title */}
          <View>
            <Text className="mb-2 text-sm font-medium text-gray-700">Event Title *</Text>
            <Controller
              control={control}
              rules={{
                required: 'Title is required',
                minLength: { value: 3, message: 'Title must be at least 3 characters' },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`rounded-lg border px-4 py-3 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter event title"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
              name="title"
            />
            {errors.title && (
              <Text className="mt-1 text-sm text-red-600">{errors.title.message}</Text>
            )}
          </View>

          {/* Description */}
          <View>
            <Text className="mb-2 text-sm font-medium text-gray-700">Description</Text>
            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="rounded-lg border border-gray-300 px-4 py-3"
                  placeholder="Enter event description"
                  multiline
                  numberOfLines={4}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  textAlignVertical="top"
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
              rules={{
                required: 'Start time is required',
              }}
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
              <Text className="mt-1 text-sm text-red-600">{errors.startTime.message}</Text>
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
            className={`mt-6 rounded-lg px-6 py-4 ${creating ? 'bg-gray-400' : 'bg-green-500'}`}
            onPress={handleSubmit(onSubmit)}
            disabled={creating}>
            <Text className="text-center text-lg font-semibold text-white">
              {creating ? 'Creating Event...' : 'Create Event'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
