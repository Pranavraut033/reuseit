import { useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { yupResolver } from '@hookform/resolvers/yup';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { Alert, Modal, Switch, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toast } from 'toastify-react-native';

import { CreatePostInput, LocationType, PostType } from '~/__generated__/graphql';
import ScreenContainer from '~/components/common/ScreenContainer';
import {
  DateTimeField,
  Label,
  LocationField,
  MediaField,
  MediaItem,
  TextField,
} from '~/components/form';
import { PostCard } from '~/components/post/PostCard';
import { TagEditor } from '~/components/post/TagEditor';
import { useAuth } from '~/context/AuthContext';
import { Post } from '~/gql/fragments';
import { DateTime } from '~/gql/helper.types';
import { CREATE_POST, GET_POSTS } from '~/gql/posts';
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

const defaultValues: PostCreateFormData = {
  anonymous: false,
  description: '',
  postType: PostType.Giveaway,
  tags: [],
  title: '',
};

export const PostCreateScreen: React.FC = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const methods = useForm<PostCreateFormData>({
    resolver: yupResolver(postCreateSchema),
    mode: 'onChange',
    defaultValues: defaultValues,
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    reset,
  } = methods;

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
      if (images.length === 0 && !data.description) {
        Alert.alert('Invalid Post', 'Please add at least a description or images.');
        return;
      }

      // Upload images
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadPostImages();
      }

      // Prepare mutation input
      const createPostInput: CreatePostInput = {
        ...data,
        pickupDate: new Date(data.pickupDate as DateTime),
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
        variables: { createPostInput: createPostInput },
        optimisticResponse: { createPost: post },
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
    <ScreenContainer
      keyboardAvoiding
      padding={0}
      scroll
      header={
        <View className={`flex-row items-center border-b border-gray-200 bg-white px-4 py-3`}>
          <TouchableOpacity
            onPress={handleCancel}
            disabled={isLoading}
            accessible={true}
            accessibilityLabel={t('accessibility.cancelButton')}
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={28} color="#1F2937" />
          </TouchableOpacity>

          <Text className="mx-4 text-xl font-bold text-gray-800">{t('postCreate.title')}</Text>
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
      }
      root={
        <>
          <ModalPreview formValues={formValues} images={images} />
        </>
      }
    >
      <View className="flex-1">
        <View className="p-4 ">
          <FormProvider {...methods}>
            {/* Post Type Section */}
            <View className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
              <Text className="mb-4 text-lg font-bold text-gray-800">
                {t('postCreate.postType')}
              </Text>
              <Controller
                control={control}
                name="postType"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      { value: 'GIVEAWAY', label: t('postTypes.giveaway') },
                      { value: 'REQUESTS', label: t('postTypes.requests') },
                    ].map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        className={`rounded-full border px-4 py-2.5 ${value === type.value ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-gray-100'}`}
                        onPress={() => onChange(type.value)}
                        disabled={isLoading}
                        accessible={true}
                        accessibilityLabel={`${type.label} post type`}
                        accessibilityRole="button"
                      >
                        <Text
                          className={`text-[14px] font-medium ${value === type.value ? 'font-semibold text-blue-800' : 'text-gray-600'}`}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
              {errors.postType && (
                <Text className="mt-1 text-[13px] text-red-500">{errors.postType.message}</Text>
              )}
            </View>

            {/* Content Section */}
            <View className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
              <Text className="mb-4 text-lg font-bold text-gray-800">
                {t('postCreate.content')}
              </Text>

              <TextField
                name="title"
                label={`${t('postCreate.title')} *`}
                placeholder={t('postCreate.titlePlaceholder')}
                rules={{ required: 'Title is required' }}
                maxLength={100}
              />

              <TextField
                name="description"
                label={`${t('postCreate.description')} *`}
                placeholder={t('postCreate.descriptionPlaceholder')}
                multiline
                numberOfLines={4}
                rules={{ required: 'Description is required' }}
                maxLength={1000}
              />

              {formValues.postType === 'GIVEAWAY' && (
                <View className="mb-4">
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
                </View>
              )}

              <MediaField
                name="images"
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
            </View>

            {/* Details & Context Section */}
            {formValues.postType === 'GIVEAWAY' && (
              <View className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
                <Text className="mb-4 text-lg font-bold text-gray-800">
                  {t('postCreate.detailsContext')}
                </Text>

                <View className="mb-4">
                  <Label required>{t('postCreate.category')}</Label>
                  <Controller
                    control={control}
                    name="category"
                    render={({ field: { onChange, value } }) => (
                      <View className="flex-row flex-wrap gap-2">
                        {categories.map((cat) => (
                          <TouchableOpacity
                            key={cat.value}
                            className={`rounded-full border px-4 py-2.5 ${value === cat.value ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-gray-100'}`}
                            onPress={() => onChange(cat.value)}
                            disabled={isLoading}
                            accessible={true}
                            accessibilityLabel={`${cat.label} category`}
                            accessibilityRole="button"
                          >
                            <Text
                              className={`text-[14px] font-medium ${value === cat.value ? 'font-semibold text-blue-800' : 'text-gray-600'}`}
                            >
                              {cat.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  />
                  {errors.category && (
                    <Text className="mt-1 text-[13px] text-red-500">{errors.category.message}</Text>
                  )}
                </View>

                <View className="mb-4">
                  <Label required>{t('postCreate.condition')}</Label>
                  <Controller
                    control={control}
                    name="condition"
                    render={({ field: { onChange, value } }) => (
                      <View className="flex-row gap-2">
                        {conditions.map((cond) => (
                          <TouchableOpacity
                            key={cond.value}
                            className={`flex-1 items-center rounded-xl border py-3 ${value === cond.value ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-gray-100'}`}
                            onPress={() => onChange(cond.value)}
                            disabled={isLoading}
                            accessible={true}
                            accessibilityLabel={`${cond.label} condition`}
                            accessibilityRole="button"
                          >
                            <Text
                              className={`text-[14px] font-medium ${value === cond.value ? 'font-semibold text-blue-800' : 'text-gray-600'}`}
                            >
                              {cond.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  />
                  {errors.condition && (
                    <Text className="mt-1 text-[13px] text-red-500">
                      {errors.condition.message}
                    </Text>
                  )}
                </View>

                {formValues.postType === 'GIVEAWAY' && (
                  <DateTimeField
                    name="pickupDate"
                    label={`${t('postCreate.pickupDateOptional')} *`}
                    placeholder="Select pickup date"
                    minimumDate={new Date()}
                    rules={{ required: 'Pickup date is required' }}
                  />
                )}
              </View>
            )}

            {/* Event Details Section - Removed as EVENT and MEETUP types are no longer supported */}

            {/* Configuration Section */}
            <View className="mb-20 rounded-xl border border-gray-200 bg-white p-4">
              <Text className="mb-4 text-lg font-bold text-gray-800">
                {t('postCreate.configuration')}
              </Text>

              <View className="flex-row items-center justify-between">
                <Label className="mb-0">{t('postCreate.anonymous')}</Label>
                <Controller
                  control={control}
                  name="anonymous"
                  render={({ field: { onChange, value } }) => (
                    <Switch
                      value={value}
                      onValueChange={onChange}
                      trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                      thumbColor={value ? '#FFFFFF' : '#F9FAFB'}
                    />
                  )}
                />
              </View>
            </View>
          </FormProvider>
        </View>
      </View>
    </ScreenContainer>
  );
};

type ModalPreviewProps = {
  formValues: PostCreateFormData;
  images: MediaItem[];
};

const ModalPreview: React.FC<ModalPreviewProps> = ({ formValues, images }) => {
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
        hideOnScrollDown
        className="absolute bottom-8 right-8"
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
              <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
                <View className="flex-row items-center">
                  <Ionicons name="eye" size={20} color="#6B7280" />
                  <Text className="ml-2 text-lg font-semibold text-gray-900">
                    {t('postCreate.preview')}
                  </Text>
                </View>
                <TouchableOpacity
                  className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
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
                  isPreview
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
