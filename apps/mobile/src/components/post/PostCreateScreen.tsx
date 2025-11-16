import { useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { yupResolver } from '@hookform/resolvers/yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import { format } from 'date-fns';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Toast } from 'toastify-react-native';

import Container from '~/components/common/Container';
import { LocationPicker } from '~/components/post/LocationPicker';
import { MediaItem, MediaPicker } from '~/components/post/MediaPicker';
import { PreviewCard } from '~/components/post/PreviewCard';
import { TagEditor } from '~/components/post/TagEditor';
import { useAuth } from '~/context/AuthContext';
import { CREATE_POST } from '~/gql/feeds/createPost';
import { GET_POSTS } from '~/gql/feeds/getPosts';
import { t } from '~/utils/i18n';
import { compressImages } from '~/utils/imageCompression';
import { saveOfflinePost } from '~/utils/offlineStorage';
import {
  categories,
  conditions,
  PostCreateFormData,
  postCreateSchema,
} from '~/utils/postValidation';
import { uploadImages } from '~/utils/storage';
import { suggestTagsFromImages } from '~/utils/tagSuggestion';

export const PostCreateScreen: React.FC = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Check network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
    });

    return () => unsubscribe();
  }, []);

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    reset,
  } = useForm<PostCreateFormData>({
    resolver: yupResolver(postCreateSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      category: '' as any,
      condition: '' as any,
      tags: [],
      images: [],
      location: null,
      pickupDate: null,
    },
  });

  const formValues = watch();

  // GraphQL Mutation
  const [createPost, { loading: isCreating }] = useMutation(CREATE_POST, {
    refetchQueries: [{ query: GET_POSTS }],
    awaitRefetchQueries: true,
    onCompleted: () => {
      Toast.success(t('postCreate.success'));
      resetForm();
      router.back();
    },
    onError: (error) => {
      Toast.error(error.message || t('postCreate.error'));
    },
  });

  const resetForm = () => {
    reset();
    setImages([]);
  };

  const handleImageTagSuggestions = async (imageUris: string[]) => {
    try {
      const suggestions = await suggestTagsFromImages(imageUris);
      const currentTags = formValues.tags || [];
      const newTags = suggestions
        .filter((s) => !currentTags.includes(s.tag))
        .map((s) => s.tag)
        .slice(0, 3);

      if (newTags.length > 0) {
        setValue('tags', [...currentTags, ...newTags]);
      }
    } catch (error) {
      console.error('Error getting image tag suggestions:', error);
    }
  };

  const uploadPostImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    setIsUploading(true);
    try {
      const imageUris = images.map((img) => img.uri);
      const compressedImages = await compressImages(imageUris, 0.8);
      const uploadedUrls = await uploadImages(
        compressedImages.map((img) => img.uri),
        user?.id || 'anonymous',
        'posts',
      );
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOfflineSubmit = async (data: PostCreateFormData) => {
    try {
      const offlineId = await saveOfflinePost({
        data: {
          ...data,
          images: images.map((img) => img.uri),
        },
        images: images.map((img) => img.uri),
      });

      Toast.info(t('postCreate.offline'));
      resetForm();
      router.back();
    } catch (error) {
      console.error('Error saving offline post:', error);
      Alert.alert('Error', 'Failed to save post offline. Please try again.');
    }
  };

  const onSubmit = async (data: PostCreateFormData) => {
    try {
      // Validate images
      if (images.length === 0 && !data.title && !data.description) {
        Alert.alert('Invalid Post', 'Please add at least a title, description, or images.');
        return;
      }

      // Handle offline mode
      if (!isOnline) {
        await handleOfflineSubmit(data);
        return;
      }

      // Upload images
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadPostImages();
      }

      // Prepare mutation input
      const createPostInput: any = {
        content: `${data.title}\n\n${data.description || ''}`.trim(),
        images: imageUrls,
      };

      // Add location if provided
      if (data.location) {
        createPostInput.locationId = data.location.googlePlaceId;
      }

      // Create post
      await createPost({
        variables: { createPostInput },
        optimisticResponse: {
          createPost: {
            __typename: 'Post',
            id: `temp-${Date.now()}`,
            content: createPostInput.content,
            createdAt: new Date().toISOString(),
            images: imageUrls,
            likes: 0,
            likedByCurrentUser: false,
            author: {
              __typename: 'User',
              id: user?.id || '',
              name: user?.name || 'User',
              avatarUrl: user?.avatarUrl || null,
            },
            comments: [],
            location: null,
          },
        },
      });
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', t('postCreate.error'));
    }
  };

  const handleCancel = () => {
    const hasContent =
      formValues.title ||
      formValues.description ||
      images.length > 0 ||
      (formValues.tags && formValues.tags.length > 0);

    if (hasContent) {
      Alert.alert(t('postCreate.discardTitle'), t('postCreate.discardMessage'), [
        { text: t('postCreate.keepEditing'), style: 'cancel' },
        {
          text: t('postCreate.discard'),
          style: 'destructive',
          onPress: () => {
            resetForm();
            router.back();
          },
        },
      ]);
    } else {
      router.back();
    }
  };

  const isLoading = isCreating || isUploading;

  return (
    <Container noPadding>
      {/* Header */}
      <View
        className={`flex-row ab justify-between items-center px-4 py-3 bg-white border-b border-gray-200`}
      >
        <TouchableOpacity
          onPress={handleCancel}
          disabled={isLoading}
          accessible={true}
          accessibilityLabel={t('accessibility.cancelButton')}
          accessibilityRole="button"
        >
          <Ionicons name="close" size={28} color="#1F2937" />
        </TouchableOpacity>

        <Text className="text-lg font-bold text-gray-800">{t('postCreate.title')}</Text>

        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading || !isValid}
          className={`px-4 py-2 rounded-full min-w-[80px] items-center ${!isValid || isLoading ? 'bg-gray-300' : 'bg-blue-500'}`}
          accessible={true}
          accessibilityLabel={t('accessibility.publishButton')}
          accessibilityRole="button"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text className="text-[15px] font-semibold text-white">{t('postCreate.publish')}</Text>
          )}
        </TouchableOpacity>
      </View>
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Offline Indicator */}
        {!isOnline && (
          <View className="flex-row items-center gap-2 p-3 bg-amber-100 border-b border-amber-200">
            <Ionicons name="cloud-offline" size={16} color="#F59E0B" />
            <Text className="text-[13px] text-amber-900">Offline - Post will be saved locally</Text>
          </View>
        )}

        {/* Form Fields */}
        <View className="p-4">
          {/* Title */}
          <View className="mb-5">
            <Text className="text-[15px] font-semibold text-gray-800 mb-2">
              {t('postCreate.title')} <Text className="text-red-500">*</Text>
            </Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`p-3 bg-white rounded-xl border text-[15px] text-gray-800 ${errors.title ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder={t('postCreate.titlePlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={!isLoading}
                  maxLength={100}
                  accessible={true}
                  accessibilityLabel={t('accessibility.titleInput')}
                />
              )}
            />
            {errors.title && (
              <Text className="text-[13px] text-red-500 mt-1">{errors.title.message}</Text>
            )}
          </View>

          {/* Description */}
          <View className="mb-5">
            <Text className="text-[15px] font-semibold text-gray-800 mb-2">
              {t('postCreate.description')}
            </Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`p-3 bg-white rounded-xl border text-[15px] text-gray-800 min-h-[100px] ${errors.description ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder={t('postCreate.descriptionPlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={4}
                  maxLength={1000}
                  editable={!isLoading}
                  textAlignVertical="top"
                  accessible={true}
                  accessibilityLabel={t('accessibility.descriptionInput')}
                />
              )}
            />
          </View>

          {/* Category */}
          <View className="mb-5">
            <Text className="text-[15px] font-semibold text-gray-800 mb-2">
              {t('postCreate.category')} <Text className="text-red-500">*</Text>
            </Text>
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row flex-wrap gap-2">
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      className={`px-4 py-2.5 rounded-full border ${value === cat.value ? 'bg-blue-100 border-blue-500' : 'bg-gray-100 border-gray-200'}`}
                      onPress={() => onChange(cat.value)}
                      disabled={isLoading}
                      accessible={true}
                      accessibilityLabel={`${cat.label} category`}
                      accessibilityRole="button"
                    >
                      <Text
                        className={`text-[14px] font-medium ${value === cat.value ? 'text-blue-800 font-semibold' : 'text-gray-600'}`}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
            {errors.category && (
              <Text className="text-[13px] text-red-500 mt-1">{errors.category.message}</Text>
            )}
          </View>

          {/* Condition */}
          <View className="mb-5">
            <Text className="text-[15px] font-semibold text-gray-800 mb-2">
              {t('postCreate.condition')} <Text className="text-red-500">*</Text>
            </Text>
            <Controller
              control={control}
              name="condition"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row gap-2">
                  {conditions.map((cond) => (
                    <TouchableOpacity
                      key={cond.value}
                      className={`flex-1 py-3 rounded-xl border items-center ${value === cond.value ? 'bg-blue-100 border-blue-500' : 'bg-gray-100 border-gray-200'}`}
                      onPress={() => onChange(cond.value)}
                      disabled={isLoading}
                      accessible={true}
                      accessibilityLabel={`${cond.label} condition`}
                      accessibilityRole="button"
                    >
                      <Text
                        className={`text-[14px] font-medium ${value === cond.value ? 'text-blue-800 font-semibold' : 'text-gray-600'}`}
                      >
                        {cond.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
            {errors.condition && (
              <Text className="text-[13px] text-red-500 mt-1">{errors.condition.message}</Text>
            )}
          </View>

          {/* Media Picker */}
          <MediaPicker
            images={images}
            onImagesChange={(newImages) => {
              setImages(newImages);
              setValue(
                'images',
                newImages.map((img) => img.uri),
              );
            }}
            maxImages={4}
            onTagSuggestions={handleImageTagSuggestions}
          />

          {/* Tag Editor */}
          <Controller
            control={control}
            name="tags"
            render={({ field: { onChange, value } }) => (
              <TagEditor
                tags={value || []}
                onTagsChange={onChange}
                category={formValues.category}
                condition={formValues.condition}
                description={formValues.description}
              />
            )}
          />

          {/* Location Picker */}
          <Controller
            control={control}
            name="location"
            render={({ field: { onChange, value } }) => (
              <LocationPicker location={value} onLocationChange={onChange} />
            )}
          />

          {/* Pickup Date */}
          <View className="mb-5">
            <Text className="text-[15px] font-semibold text-gray-800 mb-2">
              {t('postCreate.pickupDateOptional')}
            </Text>
            <Controller
              control={control}
              name="pickupDate"
              render={({ field: { onChange, value } }) => (
                <>
                  <TouchableOpacity
                    className="flex-row items-center gap-3 p-3 bg-white rounded-xl border border-gray-200"
                    onPress={() => setShowDatePicker(true)}
                    accessible={true}
                    accessibilityLabel={t('accessibility.datePickerButton')}
                    accessibilityRole="button"
                  >
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                    <Text className="text-[15px] text-gray-800">
                      {value ? format(new Date(value), 'MMM dd, yyyy') : 'Select pickup date'}
                    </Text>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      value={value ? new Date(value) : new Date()}
                      mode="date"
                      minimumDate={new Date()}
                      onChange={(_event, selectedDate) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (selectedDate) {
                          onChange(selectedDate);
                        }
                      }}
                    />
                  )}
                </>
              )}
            />
          </View>

          {/* Preview Card */}
          <PreviewCard
            formData={formValues}
            images={images.map((img) => img.uri)}
            userName={user?.name}
            userAvatar={user?.avatarUrl || undefined}
          />
        </View>
      </ScrollView>
    </Container>
  );
};
