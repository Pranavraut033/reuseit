import { useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FC, useCallback, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { Toast } from 'toastify-react-native';

import Field from '~/components/common/Field';
import IconButton from '~/components/common/IconButton';
import { useAuth } from '~/context/AuthContext';
import { CREATE_POST } from '~/gql/feeds/createPost';
import { GET_POSTS } from '~/gql/feeds/getPosts';
import { GET_USER_POSTS } from '~/gql/feeds/getUserPosts';
import { useImagePicker } from '~/hooks/useImagePicker';
import { uploadImages } from '~/utils/storage';

import { AddImageButton } from './AddImageButton';
import { ImagePreviewList } from './ImagePreviewList';

const MAX_IMAGES = 5;
const MAX_CONTENT_LENGTH = 500;

type CreatePostFormData = {
  content: string;
};

const CreatePostForm: FC = () => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const { images, removeImage, clearImages, showImagePickerOptions } = useImagePicker();

  const methods = useForm<CreatePostFormData>({
    mode: 'onChange',
    defaultValues: {
      content: '',
    },
  });

  const {
    handleSubmit: handleFormSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = methods;

  const content = watch('content');
  const remainingChars = MAX_CONTENT_LENGTH - (content?.length || 0);
  const isOverLimit = remainingChars < 0;

  const [createPost, { loading: isCreating }] = useMutation(CREATE_POST, {
    refetchQueries: [
      { query: GET_POSTS },
      { query: GET_USER_POSTS, variables: { authorId: user?.id } },
    ],
    awaitRefetchQueries: true,
    onCompleted: () => {
      Toast.success('Your post has been published!');
      resetForm();
      router.back();
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to create post');
    },
  });

  const resetForm = useCallback(() => {
    reset();
    clearImages();
  }, [reset, clearImages]);

  const onSubmit = useCallback(
    async (data: CreatePostFormData) => {
      if (!data.content.trim() && images.length === 0) {
        Alert.alert('Invalid Post', 'Please add some content or images to your post.');
        return;
      }

      try {
        setIsUploading(true);

        // Upload images to Firebase Storage if any
        let imageUrls: string[] = [];
        if (images.length > 0 && user?.id) {
          imageUrls = await uploadImages(
            images.map((img) => img.uri),
            user.id,
            'posts',
          );
        }

        // Create post with uploaded image URLs
        await createPost({
          variables: {
            createPostInput: {
              content: data.content.trim(),
              images: imageUrls,
            },
          },
        });
      } catch (error) {
        console.error('Error creating post:', error);
        Alert.alert('Error', 'Failed to create post. Please try again.');
      } finally {
        setIsUploading(false);
      }
    },
    [images, createPost, user],
  );

  const handleCancel = useCallback(() => {
    if (content?.trim() || images.length > 0) {
      Alert.alert('Discard Post?', 'Are you sure you want to discard this post?', [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
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
  }, [content, images, resetForm]);

  const isLoading = isCreating || isUploading;

  return (
    <FormProvider {...methods}>
      {/* Header */}
      <View className="mb-4 mt-4 flex-row items-center justify-between">
        <IconButton
          icon={({ size, color }) => <Ionicons name="chevron-back" size={size} color={color} />}
          onPress={handleCancel}
          disabled={isLoading}
          accessible={true}
          accessibilityLabel="Cancel post creation"
          accessibilityRole="button"
        />

        <Text className=" text-xl font-bold text-gray-800">Create Post</Text>
        <IconButton
          icon={({ size, color }) => <Ionicons name="send" size={size} color={color} />}
          onPress={handleFormSubmit(onSubmit)}
          disabled={isLoading || (!content?.trim() && images.length === 0) || isOverLimit}
          loading={isLoading}
          accessible={true}
          accessibilityLabel="Submit post"
          accessibilityRole="button"
        />
      </View>

      {/* User Info */}
      <View className="mb-4 flex-row items-center rounded-xl bg-white p-4 shadow-sm">
        <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Ionicons name="person" size={24} color="#3B82F6" />
        </View>
        <View>
          <Text className="font-semibold text-gray-800">{user?.name || 'User'}</Text>
          <Text className="text-sm text-gray-500">Posting to community</Text>
        </View>
      </View>

      {/* Content Input */}
      <View className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <Field
          name="content"
          rules={{
            maxLength: {
              value: MAX_CONTENT_LENGTH,
              message: `Content must be under ${MAX_CONTENT_LENGTH} characters`,
            },
          }}
          placeholder="What's on your mind?"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={6}
          maxLength={MAX_CONTENT_LENGTH + 50}
          inputClassName="min-h-[120px] text-base text-gray-800"
          textAlignVertical="top"
          editable={!isLoading}
          accessible={true}
          accessibilityLabel="Post content"
          accessibilityHint="Enter the text content for your post"
        />
        {!isOverLimit && (
          <View className="mt-2 flex-row items-center justify-between border-t border-gray-100 pt-2">
            <Text className={`text-xs ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
              {remainingChars} characters remaining
            </Text>
          </View>
        )}
      </View>

      {/* Image Preview */}
      {images.length > 0 && (
        <View className="mb-4 rounded-xl bg-white p-4 shadow-sm">
          <Text className="mb-3 font-semibold text-gray-800">Photos ({images.length})</Text>
          <ImagePreviewList images={images} onRemove={removeImage} maxImages={MAX_IMAGES} />
        </View>
      )}

      {/* Add Images */}
      <View className="mb-4">
        <AddImageButton
          onPress={showImagePickerOptions}
          disabled={isLoading}
          currentCount={images.length}
          maxCount={MAX_IMAGES}
        />
      </View>

      {/* Upload Progress */}
      {isUploading && (
        <View className="mb-4 rounded-xl bg-blue-50 p-4">
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text className="ml-3 text-sm text-blue-700">Uploading images...</Text>
          </View>
        </View>
      )}

      {/* Tips */}
      <View className="mb-6 rounded-xl bg-gray-50 p-4">
        <View className="mb-2 flex-row items-center">
          <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
          <Text className="ml-2 font-semibold text-gray-700">Tips for a great post</Text>
        </View>
        <Text className="mb-1 text-sm text-gray-600">• Share your sustainability journey</Text>
        <Text className="mb-1 text-sm text-gray-600">• Add clear, well-lit photos</Text>
        <Text className="mb-1 text-sm text-gray-600">• Be respectful and encourage others</Text>
        <Text className="text-sm text-gray-600">• Use descriptive captions</Text>
      </View>
    </FormProvider>
  );
};

export default CreatePostForm;
