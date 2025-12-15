// Using `TabBarIcon` wrapper for tab icons
import { Tabs } from 'expo-router';
import { MotiView } from 'moti';
import { ComponentProps, memo, useMemo } from 'react';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MainFabButton from '~/components/MainFabButton';
import { TabBarIcon } from '~/components/TabBarIcon';
import cn from '~/utils/cn';

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
      <Text style={{ color: String(color) }} className={cn('text-xs', { 'font-bold': focused })}>
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
    <MotiView
      animate={animate}
      transition={{ type: 'timing', duration: 200 }}
      style={{ alignItems: 'center', justifyContent: 'center' }}>
      {}
      <TabBarIcon
        className="mb-1"
        name={iconName as ComponentProps<typeof TabBarIcon>['name']}
        color={String(color)}
      />
    </MotiView>
  );
});

// Memoized tab options factory
function useTabOptions(label: string, iconName: ComponentProps<typeof TabBarIcon>['name']) {
  return useMemo<ComponentProps<typeof Tabs.Screen>['options']>(
    () => ({
      tabBarLabel: ({ color, focused }: { color: any; focused: boolean }) => (
        <AnimatedTabLabel color={String(color)} focused={focused} label={label} />
      ),
      tabBarIcon: ({ color, focused }: { color: any; focused: boolean }) => (
        <AnimatedTabIcon color={String(color)} focused={focused} iconName={String(iconName)} />
      ),
    }),
    [label, iconName],
  );
}

export default function TabLayout() {
  const homeOptions = useTabOptions('Home', 'house');
  const exploreOptions = useTabOptions('Explore', 'map-location-dot');
  const postsOptions = useTabOptions('Posts', 'newspaper');
  const profileOptions = useTabOptions('Profile', 'user');
  const eventsOptions = useTabOptions('Events', 'calendar');
  const { bottom } = useSafeAreaInsets();
  const PRIMARY = '#2ECC71';
  const FOREST = '#34495E';
  const CANVAS = 'rgba(249,249,249,0.98)';

  return (
    <>
      <MainFabButton />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: PRIMARY,
          tabBarInactiveTintColor: FOREST,
          tabBarIconStyle: { marginBottom: 0 },
          tabBarStyle: {
            position: 'absolute',
            left: 16,
            right: 16,
            height: 58,
            backgroundColor: CANVAS,
            bottom: bottom + 16,
            borderRadius: 9999,
            paddingBottom: 12,
            paddingLeft: 4,
            paddingRight: 4,
            paddingTop: 12,
            elevation: 20,
            zIndex: 25, // ensure it appears above other content
            marginHorizontal: 16,
            marginRight: 48 + 16 * 2,
            borderWidth: 0.5,
            borderColor: 'rgba(52,73,94,0.06)',
          },
          // tabBarBackground: () => <TabBarBackground />,
        }}>
        <Tabs.Screen name="index" options={homeOptions} />
        <Tabs.Screen name="posts" options={postsOptions} />
        <Tabs.Screen name="explore" options={exploreOptions} />
        <Tabs.Screen name="events" options={eventsOptions} />
        <Tabs.Screen name="profile" options={profileOptions} />
      </Tabs>
    </>
  );
}

// function TabBarBackground() {
//   const pathname = usePathname();
//   const isExplore = pathname === '/explore';

//   return (
//     <BlurView
//       intensity={100}
//       tint="extraLight"
//       className="absolute inset-0 z-[11]"
//       experimentalBlurMethod={isExplore ? 'none' : 'dimezisBlurView'}
//       style={{
//         flex: 1,
//         zIndex: 20,
//         borderRadius: 999,
//         overflow: 'hidden',
//         backgroundColor: isExplore ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.9)',
//       }}
//     />
//   );
// }
