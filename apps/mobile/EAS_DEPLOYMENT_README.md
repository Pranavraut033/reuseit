# EAS Build Setup for Manual Upload to App Stores

## Prerequisites

1. **Google Play Console Account**: Create a developer account at https://play.google.com/console/
2. **Apple Developer Account**: For iOS deployment
3. **Expo Account**: For EAS Build access

## Setup Steps

### 1. Create App Store Listings
- **Android**: Go to Google Play Console and create a new app with package name `ai.reuseit.app`
- **iOS**: Go to App Store Connect and create a new app

### 2. Configure EAS Credentials
Run these commands in the mobile app directory:

```bash
cd apps/mobile

# Login to EAS
eas login

# Set up Android credentials (keystore will be generated automatically)
eas credentials

# For manual keystore setup (optional):
eas credentials --platform android
```

### 3. Update Production Environment

Edit `apps/mobile/.env` and set your production backend URL:

```
EXPO_PUBLIC_APP_URL="https://your-production-backend-domain.com"
```

### 4. Build Production App
```bash
# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

### 5. Download and Upload Manually
1. After the build completes, go to the Expo dashboard (https://expo.dev/)
2. Find your build and download the artifact (.aab for Android, .ipa for iOS)
3. **Android**: Upload the .aab file to Google Play Console under "Production" track
4. **iOS**: Upload the .ipa file to App Store Connect using Transporter or Xcode

## Testing the Build

Before uploading to production, test with internal tracks:

1. Build with preview profile: `eas build --platform android --profile preview`
2. Download and upload to internal testing track in the respective console
3. Add testers and test thoroughly

## Production Deployment Checklist

- [ ] EAS credentials set up
- [ ] Production backend URL configured
- [ ] App icons and assets ready
- [ ] Store listings completed (Google Play & App Store)
- [ ] Privacy policy URLs added
- [ ] Test build successful
- [ ] Internal testing completed
- [ ] Ready for manual production upload

## Troubleshooting

**Build fails**: Check that all assets exist and credentials are correct
**Upload fails**: Verify app store accounts have correct permissions and app IDs
**App crashes**: Check production environment variables
