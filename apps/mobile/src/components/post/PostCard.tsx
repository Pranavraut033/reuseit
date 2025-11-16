import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Post } from '~/gql/posts/getPosts';
import { t } from '~/utils/i18n';
import { PostCreateFormData } from '~/utils/postValidation';

type BaseProps = {
  images: string[];
  userName?: string;
  userAvatar?: string;
};

type PostCardProps =
  | (BaseProps & {
      isPreview: true;
      post?: undefined;
      formData: Partial<PostCreateFormData>;
    })
  | (BaseProps & {
      isPreview: false;
      post: Post;
      formData: undefined;
    });

export const PostCard: React.FC<PostCardProps> = ({
  formData,
  post,
  isPreview,
  images,
  userName = 'User',
  userAvatar,
}) => {
  const { title, description, category, condition, tags, location, pickupDate } = useMemo(() => {
    if (isPreview) {
      return formData;
    }

    return {
      title: post.title,
      description: post.content,
      category: post.category,
      condition: post.condition,
      tags: post.tags,
      location: post.location,
      pickupDate: post.pickupDate,
    };
  }, [isPreview, formData, post]);

  const hasContent = title || description || images.length > 0;

  if (!hasContent) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="eye-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateText}>Start adding content to see preview</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="eye" size={20} color="#6B7280" />
        <Text style={styles.headerText}>{t('postCreate.preview')}</Text>
      </View>

      <View style={styles.card}>
        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={24} color="#3B82F6" />
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.timestamp}>Just now</Text>
          </View>
        </View>

        {/* Images Preview */}
        {images.length > 0 && (
          <View style={styles.imagesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              contentContainerStyle={styles.imagesScroll}
            >
              {images.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.imageCounter}>
                <Ionicons name="images" size={14} color="#FFF" />
                <Text style={styles.imageCounterText}>{images.length}</Text>
              </View>
            )}
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {title && (
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
          )}

          {description && (
            <Text style={styles.description} numberOfLines={3}>
              {description}
            </Text>
          )}

          {/* Metadata */}
          <View style={styles.metadata}>
            {category && (
              <View style={styles.metadataItem}>
                <Ionicons name="grid-outline" size={14} color="#6B7280" />
                <Text style={styles.metadataText}>{t(`categories.${category}`)}</Text>
              </View>
            )}

            {condition && (
              <View style={styles.metadataItem}>
                <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
                <Text style={styles.metadataText}>{t(`conditions.${condition}`)}</Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsContainer}
            >
              {tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Location & Pickup Date */}
          {(location || pickupDate) && (
            <View style={styles.additionalInfo}>
              {location && (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoText} numberOfLines={1}>
                    {location.address || location.name || 'Location set'}
                  </Text>
                </View>
              )}

              {pickupDate && (
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>
                    {format(new Date(pickupDate), 'MMM dd, yyyy')}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Engagement Preview */}
        <View style={styles.engagement}>
          <View style={styles.engagementItem}>
            <Ionicons name="heart-outline" size={20} color="#6B7280" />
            <Text style={styles.engagementText}>0</Text>
          </View>
          <View style={styles.engagementItem}>
            <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
            <Text style={styles.engagementText}>0</Text>
          </View>
          <View style={styles.engagementItem}>
            <Ionicons name="share-outline" size={20} color="#6B7280" />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  imagesContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  imagesScroll: {
    gap: 0,
  },
  previewImage: {
    width: 300,
    height: 300,
  },
  imageCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 12,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 13,
    color: '#6B7280',
  },
  tagsContainer: {
    gap: 6,
    paddingVertical: 4,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
  },
  additionalInfo: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  engagement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  engagementText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
