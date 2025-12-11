import { ScrollView, Text } from 'react-native';

import ScreenContainer from '~/components/common/ScreenContainer';

export default function PrivacyPolicyScreen() {
  return (
    <ScreenContainer>
      <ScrollView className="p-6">
        <Text className="mb-4 text-2xl font-bold">Privacy Policy</Text>
        <Text className="mb-2 text-gray-700">
          ReUseIt is committed to protecting your privacy and complying with the General Data
          Protection Regulation (GDPR).
        </Text>
        <Text className="mb-1 mt-4 font-semibold">What Data We Collect</Text>
        <Text className="mb-2 text-gray-700">
          - Name, email, phone number (if provided)
          {'\n'}- Profile information, posts, comments, and activity
          {'\n'}- Device and usage data (for analytics and security)
        </Text>
        <Text className="mb-1 mt-4 font-semibold">How We Use Your Data</Text>
        <Text className="mb-2 text-gray-700">
          - To provide and improve our services
          {'\n'}- To personalize your experience
          {'\n'}- For security, fraud prevention, and legal compliance
        </Text>
        <Text className="mb-1 mt-4 font-semibold">Your Rights</Text>
        <Text className="mb-2 text-gray-700">
          - Access: Request a copy of your data
          {'\n'}- Correction: Update your information
          {'\n'}- Deletion: Delete your account and all associated data
          {'\n'}- Export: Export your data at any time
          {'\n'}- Withdraw Consent: Withdraw consent for data processing
        </Text>
        <Text className="mb-1 mt-4 font-semibold">Data Retention</Text>
        <Text className="mb-2 text-gray-700">
          We retain your data only as long as necessary for the purposes described above or as
          required by law.
        </Text>
        <Text className="mb-1 mt-4 font-semibold">Data Security</Text>
        <Text className="mb-2 text-gray-700">
          We use encryption and secure storage for your data. Sensitive data is never shared with
          third parties without your consent.
        </Text>
        <Text className="mb-1 mt-4 font-semibold">Contact</Text>
        <Text className="mb-2 text-gray-700">
          For privacy questions or requests, contact: privacy@reuseit.com
        </Text>
        <Text className="mt-6 text-xs text-gray-400">Last updated: 7 December 2025</Text>
      </ScrollView>
    </ScreenContainer>
  );
}
