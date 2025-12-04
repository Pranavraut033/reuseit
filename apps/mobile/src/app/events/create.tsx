import { useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { yupResolver } from '@hookform/resolvers/yup';
import { router } from 'expo-router';
import { useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Toast } from 'toastify-react-native';

import ScreenContainer from '~/components/common/ScreenContainer';
import {
  DateTimeField,
  LocationField,
  MediaField,
  MediaItem,
  SubmitButton,
  TextField,
} from '~/components/form';
import { useAuth } from '~/context/AuthContext';
import { CREATE_EVENT } from '~/gql/events';
import { EventCreateFormData, eventCreateSchema } from '~/utils/eventValidation';
import { compressImages } from '~/utils/imageCompression';
import { uploadImages } from '~/utils/storage';

export default function CreateEventScreen() {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState<MediaItem[]>([]);

  const methods = useForm<EventCreateFormData>({
    resolver: yupResolver(eventCreateSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      startTime: new Date(),
      endTime: null,
      imageUrl: [],
    },
  });

  const { handleSubmit, control, setValue } = methods;
  const startTime = useWatch({ name: 'startTime', control });

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

  const onSubmit = async (data: EventCreateFormData) => {
    setCreating(true);

    try {
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

      // Upload images if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        setIsUploading(true);
        try {
          const imageUris = images.map((img) => img.uri);
          const compressedImages = await compressImages(imageUris, 0.8);
          imageUrls = await uploadImages(
            compressedImages.map((img) => img.uri),
            user?.id || 'anonymous',
            'events',
          );
        } catch (error) {
          console.error('Error uploading images:', error);
          Toast.error('Failed to upload images');
          setCreating(false);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      createEvent({
        variables: {
          createEventInput: {
            title: data.title,
            description: data.description,
            startTime: startTime.toISOString(),
            endTime: endTime?.toISOString(),
            imageUrl: imageUrls,
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
    } catch (error) {
      console.error('Error creating event:', error);
      Toast.error('Failed to create event');
      setCreating(false);
    }
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
              minimumDate={startTime || new Date()}
            />

            <LocationField name="location" />

            <MediaField
              name="imageUrl"
              images={images}
              onImagesChange={(newImages: MediaItem[]) => {
                setImages(newImages);
                setValue(
                  'imageUrl',
                  newImages.map((img) => img.uri),
                );
              }}
              maxImages={4}
            />

            <SubmitButton
              title="Create Event"
              loading={creating || isUploading}
              loadingText={isUploading ? 'Uploading Images...' : 'Creating Event...'}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </FormProvider>
      </ScrollView>
    </ScreenContainer>
  );
}
