import { Tabs, usePathname, useRouter } from 'expo-router';
import { TabBarIcon } from '~/src/components/TabBarIcon';
import { MotiView } from 'moti';
import { Text, View, Pressable } from 'react-native';
import clsx from 'clsx';
import { ComponentProps, memo, useMemo } from 'react';
import { FontAwesome6 as Icon } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { FabButton } from '~/src/components/common/FabButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MainFabButton from '~/src/components/MainFabButton';

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



export default function TabLayout() {
  const homeOptions = useTabOptions('Home', 'house');
  const exploreOptions = useTabOptions('Explore', 'map-location-dot');
  const postsOptions = useTabOptions('Posts', 'newspaper');
  const profileOptions = useTabOptions('Profile', 'user');
  const { bottom } = useSafeAreaInsets();

  return (
    <>
      <MainFabButton />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#34A853',
          tabBarIconStyle: { marginBottom: 3 },
          tabBarStyle: {
            position: 'absolute',
            left: 16,
            right: 16,
            height: 58,
            bottom: bottom + 16,
            borderRadius: 16,
            paddingBottom: 12,
            paddingTop: 10,
            backgroundColor: 'rgba(255,255,255,0.8)', // more translucent
            elevation: 20,
            zIndex: 25, // ensure it appears above other content
            marginHorizontal: 16,
          },
          // tabBarBackground: () => <TabBarBackground />,
        }}>
        <Tabs.Screen name="index" options={homeOptions} />
        <Tabs.Screen name="posts" options={postsOptions} />
        <Tabs.Screen
          name="blank"
          options={{ tabBarButton: () => <View style={{ width: 64 }} /> }} // disables and hides the middle tab
        />
        <Tabs.Screen name="explore" options={exploreOptions} />
        <Tabs.Screen name="profile" options={profileOptions} />
      </Tabs>
    </>
  );
}

function TabBarBackground() {
  const pathname = usePathname();
  const isExplore = pathname === '/explore';

  return (
    <BlurView
      intensity={12}
      tint="extraLight"
      className="absolute inset-0 z-[11]"
      experimentalBlurMethod={isExplore ? 'none' : 'dimezisBlurView'}
      style={{ flex: 1, zIndex: 20, borderRadius: 16, overflow: 'hidden' }}
    />
  );
}
