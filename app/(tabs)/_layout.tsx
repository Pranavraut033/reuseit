import { Tabs, useRouter } from 'expo-router';
import { TabBarIcon } from '~/components/TabBarIcon';
import { MotiView } from 'moti';
import { Text, View, Pressable } from 'react-native';
import clsx from 'clsx';
import { ComponentProps, memo, useMemo } from 'react';
import { FontAwesome6 as Icon } from '@expo/vector-icons';

// Memoized animated label
const AnimatedTabLabel = memo(function AnimatedTabLabel({
  color,
  focused,
  label,
}: {
  color: string;
  focused: boolean;
  label: string;
}) {
  const animate = focused
    ? { scale: 1, opacity: 1, translateY: -10 }
    : { scale: 0.8, opacity: 0, translateY: 0 };
  return (
    <MotiView transition={{ type: 'timing', duration: 200 }} animate={animate}>
      <Text style={{ color }} className={clsx('text-xs', { 'font-bold': focused })}>
        {label}
      </Text>
    </MotiView>
  );
});

// Memoized animated icon
const AnimatedTabIcon = memo(function AnimatedTabIcon({
  color,
  focused,
  iconName,
}: {
  color: string;
  focused: boolean;
  iconName: ComponentProps<typeof TabBarIcon>['name'];
}) {
  const animate = focused ? { translateY: -6 } : { translateY: 0 };
  return (
    <MotiView animate={animate} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={iconName} solid color={color} size={18} />
    </MotiView>
  );
});

// Memoized tab options factory
function useTabOptions(label: string, iconName: ComponentProps<typeof TabBarIcon>['name']) {
  return useMemo<ComponentProps<typeof Tabs.Screen>['options']>(
    () => ({
      tabBarLabel: ({ color, focused }: { color: string; focused: boolean }) => (
        <AnimatedTabLabel color={color} focused={focused} label={label} />
      ),
      tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
        <AnimatedTabIcon color={color} focused={focused} iconName={iconName} />
      ),
    }),
    [label, iconName]
  );
}
const CameraFabButton = memo(function CameraFabButton() {
  const router = useRouter();

  return (
    <Pressable
      android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false, radius: 40 }}
      className={clsx(
        'absolute z-20 items-center justify-center',
        'h-20 w-20 -translate-x-10 rounded-full bg-primary',
        'bottom-0 left-1/2 -translate-y-[25%] shadow shadow-primary '
      )}
      style={{
        elevation: 3,
        shadowColor: 'black',
      }}
      onPress={() => {
        router.navigate('/identify');
      }}>
      <Icon name={'camera'} solid color={'white'} size={24} />
    </Pressable>
  );
});

export default function TabLayout() {
  const homeOptions = useTabOptions('Home', 'house');
  const exploreOptions = useTabOptions('Explore', 'map-location-dot');
  const rewardsOptions = useTabOptions('Rewards', 'trophy');
  const profileOptions = useTabOptions('Profile', 'user');

  return (
    <>
      <CameraFabButton />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#34A853',
          tabBarIconStyle: { marginBottom: 3 },
          tabBarStyle: {
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 24,
            height: 58,
            borderRadius: 16,
            paddingBottom: 12,
            paddingTop: 10,
            backgroundColor: '#fff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
            marginHorizontal: 16,
          },
        }}>
        <Tabs.Screen name="index" options={homeOptions} />
        <Tabs.Screen name="explore" options={exploreOptions} />
        <Tabs.Screen
          name="blank"
          options={{ tabBarButton: () => <View style={{ width: 64 }} /> }} // disables and hides the middle tab
        />
        <Tabs.Screen name="rewards" options={rewardsOptions} />
        <Tabs.Screen name="profile" options={profileOptions} />
      </Tabs>
    </>
  );
}
