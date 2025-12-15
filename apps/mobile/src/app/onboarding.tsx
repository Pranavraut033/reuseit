import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenContainer from '~/components/common/ScreenContainer';
import { useCameraPermission } from '~/hooks/useCameraPermission';
import { useLocationPermission } from '~/hooks/useLocationPermission';
import { useNotificationPermission } from '~/hooks/useNotificationPermission';
import { useStore } from '~/store';
import { UsePermissionReturn } from '~/types/permissions';
import cn from '~/utils/cn';
import { t } from '~/utils/i18n';

const OnboardingStep = ({
  title,
  subtitle,
  description,
  icon,
}: {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
}) => (
  <View className="flex-1 items-center justify-center px-6">
    {icon && <View className="mb-8">{icon}</View>}
    <Text className="mb-2 text-center text-2xl font-bold text-gray-900">{title}</Text>
    {subtitle && <Text className="mb-4 text-center text-lg text-gray-600">{subtitle}</Text>}
    {description && <Text className="text-center text-base text-gray-500">{description}</Text>}
  </View>
);

const OnboardingFeature = ({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) => (
  <View className="mb-4 flex-row items-center rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
    <View className="mr-4">{icon}</View>
    <View className="flex-1">
      <Text className="mb-1 text-base font-semibold text-gray-900">{title}</Text>
      <Text className="text-sm text-gray-600">{description}</Text>
    </View>
  </View>
);

const PermissionItem = ({
  title,
  description,
  icon,
  props: { hasPermission: granted, requestPermission, openAppSettings, canAskAgain },
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  props: UsePermissionReturn;
}) => (
  <TouchableOpacity
    className={cn(
      'mb-4 flex-row items-center rounded-xl border border-gray-100 bg-white p-4 shadow-sm',
    )}
    onPress={
      granted
        ? undefined
        : () => {
            if (!canAskAgain) {
              openAppSettings();
              return;
            }
            requestPermission();
          }
    }>
    <View className={cn('mr-4')}>
      <View className="h-12 w-12 items-center justify-center rounded-full bg-orange-100">
        {icon}
      </View>
    </View>

    <View className="flex-1">
      <Text className="mb-1 text-base font-semibold text-gray-900">{title}</Text>
      <Text className="text-sm text-gray-600">{description}</Text>
    </View>
    <View>
      {granted ? (
        <MaterialIcons name="check-circle" size={24} color="#10B981" />
      ) : (
        <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
      )}
    </View>
  </TouchableOpacity>
);
const baseSteps = [
  // Welcome
  <OnboardingStep
    key="welcome"
    title={t('onboarding.welcome.title')}
    subtitle={t('onboarding.welcome.subtitle')}
    description={t('onboarding.welcome.description')}
    icon={
      <View className="h-24 w-24 items-center justify-center rounded-full bg-green-100">
        <Text className="text-4xl">♻️</Text>
      </View>
    }
  />,
  // Features
  <ScrollView key="features" className="flex-1" showsVerticalScrollIndicator={false}>
    <View className="flex-1 px-6 pt-12">
      <Text className="mb-8 text-center text-2xl font-bold text-gray-900">
        {t('onboarding.features.title')}
      </Text>
      <OnboardingFeature
        title={t('onboarding.features.wasteId.title')}
        description={t('onboarding.features.wasteId.description')}
        icon={
          <View className="h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Text className="text-2xl">📷</Text>
          </View>
        }
      />
      <OnboardingFeature
        title={t('onboarding.features.community.title')}
        description={t('onboarding.features.community.description')}
        icon={
          <View className="h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Text className="text-2xl">🤝</Text>
          </View>
        }
      />
      {/* COPILOT_HIDE_EVENTS_START - Remove this comment block to re-enable events in onboarding */}
      {/*
      <OnboardingFeature
        title={t('onboarding.features.events.title')}
        description={t('onboarding.features.events.description')}
        icon={
          <View className="h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <Text className="text-2xl">📅</Text>
          </View>
        }
      />
      */}
      {/* COPILOT_HIDE_EVENTS_END */}
    </View>
  </ScrollView>,
];

export default function Onboarding() {
  const setOnboardingCompleted = useStore((state) => state.setOnboardingCompleted);
  const onboardingCompleted = useStore((state) => state.onboardingCompleted);
  const pagerViewRef = useRef<PagerView>(null);
  const allPermissionsGranted = useFullAppPermissionsGranted(true);

  const permissionsStep = (
    <ScrollView key="permissions" className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="flex-1 px-6 pt-12">
        <Text className="mb-2 text-center text-2xl font-bold text-gray-900">
          {t('onboarding.permissions.title')}
        </Text>
        <Text className="mb-8 text-center text-lg text-gray-600">
          {t('onboarding.permissions.subtitle')}
        </Text>
        <PermissionItem
          title={t('onboarding.permissions.camera.title')}
          props={useCameraPermission()}
          description={t('onboarding.permissions.camera.description')}
          icon={<MaterialIcons name="photo-camera" size={24} color="#3B82F6" />}
        />
        <PermissionItem
          title={t('onboarding.permissions.location.title')}
          description={t('onboarding.permissions.location.description')}
          props={useLocationPermission()}
          icon={<MaterialIcons name="location-on" size={24} color="#EF4444" />}
        />
        <PermissionItem
          title={t('onboarding.permissions.notifications.title')}
          description={t('onboarding.permissions.notifications.description')}
          props={useNotificationPermission()}
          icon={<MaterialIcons name="notifications" size={24} color="#F59E0B" />}
        />
      </View>
    </ScrollView>
  );

  const steps = allPermissionsGranted ? baseSteps : [...baseSteps, permissionsStep];

  const [currentStep, setCurrentStep] = useState(onboardingCompleted ? baseSteps.length - 1 : 0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      pagerViewRef.current?.setPage(currentStep + 1);
    } else {
      // Complete onboarding
      setOnboardingCompleted(true);
      router.replace('/');
    }
  };

  const handleSkip = () => {
    setOnboardingCompleted(true);
    router.replace('/');
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <ScreenContainer safeArea={false} statusBarStyle="dark-content">
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Progress Indicator */}
        <View className="flex-row justify-center py-4">
          {steps.map((_, index) => (
            <View
              key={index}
              className={`mx-1 h-2 w-8 rounded-full ${
                index === currentStep ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </View>

        {/* Content */}
        <PagerView
          ref={pagerViewRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageSelected={(e: any) => setCurrentStep(e.nativeEvent.position as number)}>
          {steps.map((step, index) => (
            <View key={index} style={{ flex: 1 }}>
              {step}
            </View>
          ))}
        </PagerView>

        {/* Navigation */}
        <View className="px-6 pb-8">
          <TouchableOpacity onPress={handleNext} className="mb-4 rounded-xl bg-green-500 py-4">
            <Text className="text-center text-lg font-semibold text-white">
              {isLastStep ? t('onboarding.getStarted') : t('onboarding.next')}
            </Text>
          </TouchableOpacity>

          {!isLastStep && (
            <TouchableOpacity onPress={handleSkip} className="py-2">
              <Text className="text-center text-base text-gray-500">{t('onboarding.skip')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </ScreenContainer>
  );
}

export function useFullAppPermissionsGranted(useStatic: boolean = false): boolean {
  const { hasPermission: cameraGranted } = useCameraPermission();
  const { hasPermission: locationGranted } = useLocationPermission();
  const { hasPermission: notificationGranted } = useNotificationPermission();

  const a = cameraGranted === true && locationGranted === true && notificationGranted === true;
  const b = useRef(a).current;

  return useStatic ? b : a;
}
