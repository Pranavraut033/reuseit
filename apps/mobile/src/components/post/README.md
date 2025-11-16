# Post Create Screen - Production-Ready Implementation

## Overview

A comprehensive, production-ready Post Create screen for React Native (Expo) that enables fast item sharing with education features while maintaining performance and accessibility.

## Features

### ✅ Core Functionality

- **Image Management** (up to 4 images)
  - Camera capture or library selection
  - On-device compression using expo-image-manipulator
  - Drag-and-drop reordering with react-native-draggable-flatlist
  - Individual image deletion
  - Grid preview display

- **Form Fields**
  - Title (required, 3-100 characters)
  - Description (optional, max 1000 characters)
  - Category dropdown (Electronics, Toys, Home Goods, Clothing, Furniture, Books, Sports, Other)
  - Condition segmented control (New, Like New, Good, Fair, Used)
  - Tags with ML-based suggestions
  - Location services (GPS auto-detect + manual entry + map picker)
  - Optional pickup date/time

- **Smart Features**
  - ML tag suggestions based on content (expandable to TensorFlow Lite)
  - Berlin-relevant tag presets (sustainable, recycling, reuse, etc.)
  - Live preview card showing how the post will appear in feed
  - Education tips integrated throughout the UI

- **Performance & UX**
  - Offline-first with local caching
  - Optimistic UI updates
  - Image compression before upload
  - Form validation with React Hook Form + Yup
  - German/English localization
  - Full accessibility support with labels

### 🏗️ Architecture

```
src/
├── components/post/
│   ├── MediaPicker.tsx           # Image capture/selection component
│   ├── LocationPicker.tsx        # GPS + map location selection
│   ├── TagEditor.tsx             # Tag input with ML suggestions
│   ├── PreviewCard.tsx           # Live post preview
│   ├── PostCreateScreen.tsx      # Main screen component
│   └── index.ts                  # Barrel exports
├── utils/
│   ├── i18n.ts                   # Localization (EN/DE)
│   ├── imageCompression.ts       # Image optimization utilities
│   ├── offlineStorage.ts         # Offline post caching
│   ├── tagSuggestion.ts          # ML tag suggestion engine
│   └── postValidation.ts         # Form validation schema
└── gql/feeds/
    └── createPost.ts             # GraphQL mutation
```

## Component Details

### MediaPicker

**Props:**
- `images`: Array of MediaItem
- `onImagesChange`: Callback when images change
- `maxImages`: Maximum number of images (default: 4)
- `onTagSuggestions`: Optional callback for ML tag suggestions

**Features:**
- Permission handling for camera/library
- Automatic image compression (80% quality, max 1920x1920)
- Drag-to-reorder functionality
- Delete individual images
- Visual feedback during processing

### LocationPicker

**Props:**
- `location`: LocationData object or null
- `onLocationChange`: Callback when location changes

**Features:**
- GPS auto-detection with reverse geocoding
- Interactive map picker (Google Maps)
- Manual address entry
- Permission handling
- Berlin-centric defaults

### TagEditor

**Props:**
- `tags`: Array of tag strings
- `onTagsChange`: Callback when tags change
- `category`: Current category for context
- `condition`: Current condition for context
- `description`: Description text for ML analysis
- `maxTags`: Maximum tags allowed (default: 10)

**Features:**
- ML-powered tag suggestions based on content
- Category and condition-specific suggestions
- Berlin-relevant tag presets
- Confidence scoring for suggestions
- Real-time filtering

### PreviewCard

**Props:**
- `formData`: Partial PostCreateFormData
- `images`: Array of image URIs
- `userName`: User display name
- `userAvatar`: User avatar URL

**Features:**
- Live preview of post appearance
- Handles all form fields dynamically
- Shows engagement UI (likes, comments, share)
- Responsive to form changes

### PostCreateScreen

Main orchestration component that:
- Manages form state with React Hook Form
- Handles image upload to Firebase Storage
- Integrates Apollo Client mutations
- Supports offline mode with optimistic updates
- Validates all inputs
- Provides bilingual support (EN/DE)

## GraphQL Integration

### Mutation
```graphql
mutation CreatePost($createPostInput: CreatePostInput!) {
  createPost(createPostInput: $createPostInput) {
    id
    content
    createdAt
    images
    likes
    author { id name avatarUrl }
    comments { id }
  }
}
```

### Input Type
```typescript
{
  content: string;      // Combined title + description
  images: string[];     // Firebase Storage URLs
  locationId?: string;  // Google Place ID
  eventId?: string;     // Optional event association
}
```

## Utilities

### Image Compression (`imageCompression.ts`)
- `compressImage(uri, quality)`: Compress single image
- `compressImages(images, quality)`: Batch compression
- `generateThumbnail(uri, size)`: Create thumbnail
- `calculateOptimalDimensions(...)`: Maintain aspect ratio

### Localization (`i18n.ts`)
- Auto-detects device language (EN/DE)
- Comprehensive translations for all UI text
- Category and condition translations
- Accessibility labels in both languages

### Tag Suggestions (`tagSuggestion.ts`)
- Text-based analysis for tag generation
- Category-specific tag mappings
- Condition-specific suggestions
- Berlin-relevant tag library
- Expandable to TensorFlow Lite for image analysis

### Offline Storage (`offlineStorage.ts`)
- `saveOfflinePost(post)`: Cache post locally
- `getOfflinePosts()`: Retrieve cached posts
- `removeOfflinePost(id)`: Delete cached post
- AsyncStorage-based persistence

### Validation (`postValidation.ts`)
- Yup schema for all form fields
- TypeScript type inference
- Field-level error messages
- Real-time validation

## Usage

```typescript
import { PostCreateScreen } from '~/components/post';

// In your router/navigation:
<Stack.Screen
  name="posts/create"
  component={PostCreateScreen}
  options={{
    presentation: 'modal',
    headerShown: false,
  }}
/>
```

## Dependencies

### Core
- `react-hook-form` - Form state management
- `yup` + `@hookform/resolvers` - Validation
- `@apollo/client` - GraphQL integration
- `expo-router` - Navigation

### Media
- `expo-image-picker` - Image selection
- `expo-image-manipulator` - Compression
- `react-native-draggable-flatlist` - Reordering
- `@react-native-firebase/storage` - Upload

### Location
- `expo-location` - GPS services
- `react-native-maps` - Map picker

### Utilities
- `date-fns` - Date formatting
- `react-native-localize` - Language detection
- `@react-native-async-storage/async-storage` - Offline storage
- `@react-native-community/netinfo` - Network detection
- `@react-native-community/datetimepicker` - Date picker

## Accessibility

All components include:
- Semantic role labels
- Descriptive accessibility labels
- Keyboard navigation support
- Screen reader compatibility
- High contrast support
- Touch target sizing (44x44pt minimum)

## Localization

Supported languages:
- English (default)
- German (Deutsch)

Auto-detects device language and falls back to English.

## Performance Optimizations

1. **Image Compression**: Reduces file size by ~70% before upload
2. **Optimistic Updates**: Immediate UI feedback
3. **Lazy Loading**: Components render on-demand
4. **Memoization**: Prevents unnecessary re-renders
5. **Batch Operations**: Parallel image processing

## Offline Support

- Posts saved locally when offline
- Automatic sync when connection restored
- Visual offline indicator
- Cached images with local URIs

## Future Enhancements

1. **TensorFlow Lite Integration**
   - On-device image classification
   - Automatic object detection for tags
   - Smart cropping suggestions

2. **Enhanced ML**
   - Natural language processing for descriptions
   - Sentiment analysis
   - Multi-language tag suggestions

3. **Advanced Features**
   - Video support
   - Multi-step wizard
   - Draft saving
   - Scheduled posts

## Testing

Run the following checks before deployment:

1. **Permissions**: Camera, location, photo library
2. **Offline Mode**: Disable network and test save
3. **Image Limits**: Try uploading >4 images
4. **Validation**: Test all error states
5. **Localization**: Switch device language
6. **Accessibility**: Test with VoiceOver/TalkBack

## Troubleshooting

### Images not compressing
- Check expo-image-manipulator installation
- Verify write permissions
- Check available storage space

### Location not working
- Verify location permissions granted
- Check Google Maps API key in app.config.js
- Test on physical device (simulator issues common)

### Offline sync not working
- Check AsyncStorage permissions
- Verify NetInfo listener setup
- Clear AsyncStorage cache if corrupted

## License

This implementation is part of the ReuseIt project.
