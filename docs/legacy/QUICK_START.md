# Post Create Screen - Quick Start Guide

## 🚀 Getting Started

### 1. Navigate to Create Post

```typescript
// From anywhere in the app:
router.push('/posts/create');
```

### 2. Component Import

```typescript
import { PostCreateScreen } from '~/components/post';
// Or use individual components:
import { MediaPicker, LocationPicker, TagEditor, PreviewCard } from '~/components/post';
```

## 📋 Pre-flight Checklist

### Required Configurations

- [ ] **Firebase Storage** - Ensure Firebase Storage is configured in your project
  - Check `apps/mobile/google-services.json` exists
  - Verify storage rules allow authenticated uploads
- [ ] **Google Maps API** - For location picker
  - Add API key to `app.config.js`
  - Enable Maps SDK for Android/iOS
- [ ] **Permissions** - Request in app.json/app.config.js
  ```json
  {
    "expo": {
      "plugins": [
        [
          "expo-location",
          {
            "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location for item pickup."
          }
        ],
        [
          "expo-image-picker",
          {
            "photosPermission": "Allow $(PRODUCT_NAME) to access your photos.",
            "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera."
          }
        ]
      ]
    }
  }
  ```

### Dependencies Installed ✅

All required dependencies have been installed:

- `yup`
- `@hookform/resolvers`
- `expo-image-manipulator`
- `react-native-draggable-flatlist`
- `date-fns`
- `@react-native-community/datetimepicker`
- `@react-native-community/netinfo`

## 🎯 Usage Examples

### Basic Usage

```typescript
// apps/mobile/src/app/posts/create.tsx
import { PostCreateScreen } from '~/components/post';

export default function CreatePost() {
  return <PostCreateScreen />;
}
```

### Using Individual Components

```typescript
import { MediaPicker, LocationPicker } from '~/components/post';

function MyCustomForm() {
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);

  return (
    <>
      <MediaPicker
        images={images}
        onImagesChange={setImages}
        maxImages={4}
      />

      <LocationPicker
        location={location}
        onLocationChange={setLocation}
      />
    </>
  );
}
```

## 🔧 Configuration

### Customize Categories

Edit `apps/mobile/src/utils/postValidation.ts`:

```typescript
export const categories = [
  { value: 'electronics', label: t('categories.electronics') },
  { value: 'newCategory', label: 'New Category' }, // Add here
  // ...
];
```

### Customize Tag Suggestions

Edit `apps/mobile/src/utils/tagSuggestion.ts`:

```typescript
const CATEGORY_TAG_MAP: Record<string, string[]> = {
  electronics: ['technology', 'gadget', 'custom-tag'], // Customize
  // ...
};
```

### Change Image Limits

```typescript
// In MediaPicker component usage:
<MediaPicker maxImages={6} /> // Default is 4
```

### Adjust Compression Quality

Edit `apps/mobile/src/utils/imageCompression.ts`:

```typescript
const COMPRESSION_QUALITY = 0.9; // Default is 0.8 (80%)
const MAX_IMAGE_WIDTH = 2048; // Default is 1920
```

## 🧪 Testing Locally

### 1. Start Development Server

```bash
cd apps/mobile
pnpm start
```

### 2. Test on Physical Device (Recommended)

```bash
# iOS
pnpm ios

# Android
pnpm android
```

### 3. Test Scenarios

- [ ] Take photo with camera
- [ ] Select multiple images from library
- [ ] Drag to reorder images
- [ ] Delete individual images
- [ ] Enable GPS location
- [ ] Pick location on map
- [ ] Enter manual address
- [ ] Add/remove tags
- [ ] View tag suggestions
- [ ] Check live preview updates
- [ ] Submit form online
- [ ] Submit form offline (airplane mode)
- [ ] Test German language (change device settings)
- [ ] Test VoiceOver/TalkBack

## 🐛 Troubleshooting

### Images Not Uploading

**Problem**: Images fail to upload to Firebase Storage

**Solutions**:

1. Check Firebase configuration:
   ```bash
   # Verify files exist:
   ls apps/mobile/google-services.json # Android
   ls apps/mobile/GoogleService-Info.plist # iOS
   ```
2. Check Firebase Storage rules:
   ```javascript
   // Should allow authenticated writes
   service firebase.storage {
     match /b/{bucket}/o {
       match /posts/{userId}/{imageId} {
         allow write: if request.auth != null;
       }
     }
   }
   ```
3. Verify user is authenticated

### Location Not Working

**Problem**: GPS location not detected

**Solutions**:

1. Run on physical device (simulator has limited GPS)
2. Check permissions granted in Settings > App > Permissions
3. Enable location services in device settings
4. Check Google Maps API key in `app.config.js`

### Form Validation Errors

**Problem**: Form shows validation errors unexpectedly

**Solutions**:

1. Check Yup schema matches form structure
2. Verify all required fields have values
3. Check console for validation error details
4. Ensure form default values are correct

### Offline Mode Not Working

**Problem**: Posts not saving offline

**Solutions**:

1. Check AsyncStorage permissions
2. Clear app data and reinstall
3. Verify NetInfo is detecting offline state:
   ```typescript
   import NetInfo from '@react-native-community/netinfo';
   NetInfo.fetch().then((state) => {
     console.log('Connection type', state.type);
     console.log('Is connected?', state.isConnected);
   });
   ```

### TypeScript Errors

**Problem**: Type errors in component usage

**Solutions**:

1. Run codegen to update types:
   ```bash
   cd apps/mobile
   pnpm codegen
   ```
2. Restart TypeScript server in VS Code
3. Check import paths are correct

## 📱 Platform-Specific Notes

### iOS

- Requires physical device for camera/location
- Date picker shows as modal overlay
- Requires podfile update if adding new native modules:
  ```bash
  cd ios && pod install
  ```

### Android

- Date picker shows as inline calendar
- Requires Google Play Services for Maps
- Check `android/app/build.gradle` for minimum SDK version (21+)

### Web (Limited Support)

- Camera not supported
- Location requires browser permissions
- Image picker uses file input

## 🎨 Customization

### Styling

All components use inline StyleSheet. To customize:

```typescript
// Example: Change button color
const styles = StyleSheet.create({
  publishButton: {
    backgroundColor: '#10B981', // Change from #3B82F6
  },
});
```

### Translations

Add/edit translations in `apps/mobile/src/utils/i18n.ts`:

```typescript
export const translations = {
  en: {
    postCreate: {
      customLabel: 'Your Custom Label',
    },
  },
  de: {
    postCreate: {
      customLabel: 'Ihr benutzerdefiniertes Etikett',
    },
  },
};
```

## 📊 Performance Tips

1. **Image Compression**: Already optimized to ~70% reduction
2. **Lazy Loading**: Components render on-demand
3. **Memoization**: Use React.memo() for heavy components
4. **Debouncing**: Already implemented for tag suggestions
5. **Batch Updates**: Images compressed in parallel

## 🔐 Security Considerations

1. **Image Upload**: Uses Firebase Storage with authentication
2. **Location Data**: Optional, user consent required
3. **Offline Data**: Stored in encrypted AsyncStorage
4. **API Keys**: Keep in environment variables (not in code)

## 🚢 Deployment Checklist

Before releasing to production:

- [ ] Test on multiple devices (iOS & Android)
- [ ] Test with slow network (3G simulation)
- [ ] Test offline mode thoroughly
- [ ] Verify all permissions work
- [ ] Test with VoiceOver/TalkBack
- [ ] Test in German language
- [ ] Check Firebase quotas and billing
- [ ] Monitor error tracking (Sentry, etc.)
- [ ] Test image upload limits
- [ ] Verify Analytics events (if using)

## 📚 Additional Resources

- [React Hook Form Docs](https://react-hook-form.com/)
- [Yup Validation](https://github.com/jquense/yup)
- [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [Firebase Storage](https://firebase.google.com/docs/storage)

## 💬 Support

For issues or questions:

1. Check this guide
2. Review component README.md
3. Check implementation summary
4. Review code comments
5. Open GitHub issue

## 🎉 Success!

If you can:

- ✅ Take/select photos
- ✅ See live preview
- ✅ Get tag suggestions
- ✅ Set location
- ✅ Submit successfully

**You're ready to go!** 🚀
