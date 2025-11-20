import { useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { yupResolver } from '@hookform/resolvers/yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import { Toast } from 'toastify-react-native';

import { LocationType } from '~/__generated__/graphql';
import ScreenContainer from '~/components/common/ScreenContainer';
import { LocationPicker } from '~/components/post/LocationPicker';
import { MediaItem, MediaPicker } from '~/components/post/MediaPicker';
import { PostCard } from '~/components/post/PostCard';
import { TagEditor } from '~/components/post/TagEditor';
import { useAuth } from '~/context/AuthContext';
import { Post } from '~/gql/fragments';
import { CREATE_POST } from '~/gql/posts/createPost';
import { GET_POSTS } from '~/gql/posts/posts';
import cn from '~/utils/cn';
import { t } from '~/utils/i18n';
import { compressImages } from '~/utils/imageCompression';
import {
  categories,
  conditions,
  PostCreateFormData,
  postCreateSchema,
} from '~/utils/postValidation';
import { uploadImages } from '~/utils/storage';
import { suggestTagsFromImages } from '~/utils/tagSuggestion';

import { Button } from '../common/Button';
import { FabButton } from '../common/FabButton';

export const PostCreateScreen: React.FC = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scrollHandler, setScrollHandler] = useState<(event: any) => void>();

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
      anonymous: false,
      title: '',
      category: '',
      description: '',
      condition: '',
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

  const uploadPostImages = useCallback(async (): Promise<string[]> => {
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
  }, [images, user?.id]);

  const onSubmit = async (data: PostCreateFormData) => {
    try {
      // Validate images
      if (images.length === 0 && !data.title && !data.description) {
        Alert.alert('Invalid Post', 'Please add at least a title, description, or images.');
        return;
      }

      // Upload images
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadPostImages();
      }

      // Prepare mutation input
      const createPostInput: PostCreateFormData = {
        ...data,
        pickupDate: new Date(data.pickupDate),
        images: imageUrls,
      };

      const post: Post = {
        __typename: 'Post',
        ...createPostInput,
        id: `temp-id ${Math.random()}`,
        commentCount: 0,
        images: imageUrls,
        description: createPostInput.description,
        createdAt: new Date().toISOString(),
        author: {
          __typename: 'User',
          id: user?.id || '',
          name: user?.name || 'User',
          avatarUrl: user?.avatarUrl || null,
        },
        event: null,
        likeCount: 0,
        likedByCurrentUser: false,
        updatedAt: new Date().toISOString(),
        location: createPostInput.location
          ? {
              __typename: 'Location',
              id: 'temp-location-id',
              ...createPostInput.location,
              createdAt: new Date().toISOString(),
              type: LocationType.UserLocation,
            }
          : null,
      };

      // Create post
      return await createPost({
        variables: { createPostInput },
        optimisticResponse: {
          createPost: post,
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
    <ScreenContainer keyboardAvoiding padding={0}>
      {/* Header */}
      <View className={`flex-row items-center px-4 py-3 bg-white border-b border-gray-200`}>
        <TouchableOpacity
          onPress={handleCancel}
          disabled={isLoading}
          accessible={true}
          accessibilityLabel={t('accessibility.cancelButton')}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={28} color="#1F2937" />
        </TouchableOpacity>

        <Text className="text-xl mx-4 font-bold text-gray-800">{t('postCreate.title')}</Text>
        <View className="flex-1" />
        <Button
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading || !isValid}
          className="rounded-full py-2"
          accessible={true}
          accessibilityLabel={t('accessibility.publishButton')}
          accessibilityRole="button"
          loading={isLoading}
        >
          {t('postCreate.publish')}
        </Button>
      </View>
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => {
          scrollHandler?.(e);
        }}
      >
        <View className="p-4">
          <View className="mb-5">
            <View className="flex-row justify-between items-center mb-3 border border-gray-200 p-2 bg-gray-50 rounded-xl">
              <Text>
                Post as{' '}
                <Text
                  className={cn({ strikethrough: formValues.anonymous })}
                  style={formValues.anonymous ? { textDecorationLine: 'line-through' } : undefined}
                >
                  {user?.name}
                </Text>
                {formValues.anonymous ? ` (${t('postCreate.anonymous')})` : ''}
              </Text>
              <Controller
                control={control}
                name="anonymous"
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity
                    className="flex-row items-center"
                    onPress={() => onChange(!value)}
                    accessible={true}
                    accessibilityLabel={t('accessibility.anonymousToggle')}
                  >
                    <Ionicons name={value ? 'eye-off' : 'eye'} size={24} color="#1F2937" />
                  </TouchableOpacity>
                )}
              />
            </View>
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
              <LocationPicker location={value ?? null} onLocationChange={onChange} />
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
        </View>
      </ScrollView>
      <ModalPreview formValues={formValues} images={images} setScrollHandler={setScrollHandler} />
    </ScreenContainer>
  );
};

type ModalPreviewProps = {
  formValues: PostCreateFormData;
  images: MediaItem[];
  setScrollHandler: (handler?: (event: any) => void) => void;
};

const ModalPreview: React.FC<ModalPreviewProps> = ({ formValues, images, setScrollHandler }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { user } = useAuth();
  const sheetRef = useRef<BottomSheet>(null);

  const handleOpen = () => {
    setIsModalVisible(true);
    setTimeout(() => {
      sheetRef.current?.expand();
    }, 100);
  };

  const handleClose = () => {
    sheetRef.current?.close();
    setTimeout(() => {
      setIsModalVisible(false);
    }, 300);
  };

  return (
    <>
      <FabButton
        setScrollHandler={setScrollHandler}
        hideOnScrollDown
        className="absolute bottom-4 right-4"
        icon={() => <Ionicons name="eye" size={24} color="#FFFFFF" />}
        onPress={handleOpen}
      >
        {t('postCreate.preview')}
      </FabButton>
      <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={handleClose}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheet
            ref={sheetRef}
            snapPoints={['50%', '80%', '100%']}
            enableDynamicSizing={false}
            index={0}
            backgroundStyle={{
              backgroundColor: '#ffffff',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}
            handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40, height: 4 }}
            backdropComponent={({ style }) => (
              <TouchableOpacity
                style={[style, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
                activeOpacity={1}
                onPress={handleClose}
              />
            )}
            enablePanDownToClose
            onClose={handleClose}
          >
            <View className="flex-1 bg-white">
              {/* Header */}
              <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
                <View className="flex-row items-center">
                  <Ionicons name="eye" size={20} color="#6B7280" />
                  <Text className="text-lg font-semibold text-gray-900 ml-2">
                    {t('postCreate.preview')}
                  </Text>
                </View>
                <TouchableOpacity
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                  onPress={handleClose}
                >
                  <Ionicons name="close" size={20} color="#374151" />
                </TouchableOpacity>
              </View>

              {/* Preview Card */}
              <BottomSheetScrollView
                contentContainerStyle={{ paddingBottom: 20, padding: 16 }}
                showsVerticalScrollIndicator={false}
              >
                <PostCard
                  formData={formValues}
                  images={images.map((img) => img.uri)}
                  userName={user?.name}
                  userAvatar={user?.avatarUrl || undefined}
                />
              </BottomSheetScrollView>
            </View>
          </BottomSheet>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
};
