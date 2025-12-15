import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

import AvatarIcon from '~/components/common/AvatarIcon';
import Badge from '~/components/common/Badge';
import Card from '~/components/common/Card';
import ProgressBar from '~/components/common/ProgressBar';
import ScreenContainer from '~/components/common/ScreenContainer';
import { useAuth } from '~/context/AuthContext';
import useAppConfig from '~/hooks/useAppConfig';

type QuickAction = {
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  colors: readonly [string, string];
  onPress?: () => void;
  accessibilityLabel: string;
};

const FeedsScreen = () => {
  const { user } = useAuth();
  const appConfig = useAppConfig();

  const quickActions: QuickAction[] = [
    {
      title: 'Scan Item',
      subtitle: 'Identify recyclables',
      icon: 'camera',
      colors: ['#60A5FA', '#2563EB'] as const,
      onPress: () => router.push('/waste-analysis'),
      accessibilityLabel: 'Scan item to identify recyclable materials',
    },
    {
      title: 'Events',
      subtitle: 'Local activities',
      icon: 'calendar',
      colors: ['#A855F7', '#7C3AED'] as const,
      onPress: () => (router.push as any)('/events'),
      accessibilityLabel: 'View upcoming recycling events',
    },
    {
      title: 'My Posts',
      subtitle: 'Check your contributions',
      icon: 'file-text',
      colors: ['#34D399', '#10B981'] as const,
      onPress: () => router.push('/posts'),
      accessibilityLabel: 'Connect with the community',
    },
    {
      title: 'Progress',
      subtitle: 'Track your impact',
      icon: 'bar-chart-2',
      colors: ['#F59E0B', '#EA580C'] as const,
      onPress: () => router.push('/rewards'),
      accessibilityLabel: 'View your progress statistics',
    },
  ];

  return (
    <ScreenContainer>
      {/* Modern Header */}
      <Card className="mb-6 overflow-hidden rounded-3xl !p-0">
        <LinearGradient
          colors={['#3498DB', '#2ECC71']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-3xl p-6"
          style={{ elevation: 8 }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-white">{appConfig.name}</Text>
              <Text className="mt-2 text-lg text-white" style={{ opacity: 0.95 }}>
                Welcome back, {user?.name ?? 'friend'}! 🌟
              </Text>
              <Text className="mt-1 text-sm text-white/90">
                Let&apos;s make the world greener together
              </Text>
            </View>
            <View className="h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <AvatarIcon size={56} />
            </View>
          </View>
        </LinearGradient>
      </Card>

      {/* Enhanced Progress Widget */}
      <Card className="mb-6">
        <View className="p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="trophy" size={20} color="#2ECC71" />
              <Text className="ml-2 text-lg font-bold text-forest">Your Impact</Text>
            </View>
            <Badge className="px-3 py-1">{user?.points ?? 0} pts</Badge>
          </View>

          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="text-sm font-medium text-gray-600">7-day streak</Text>
              <Text className="ml-2 text-lg">🔥</Text>
            </View>
            <Text className="text-sm font-medium text-secondary">Keep it up!</Text>
          </View>

          <View className="mb-2">
            <ProgressBar progress={75} />
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-gray-500">75% to next level</Text>
            <Text className="text-xs font-medium text-secondary">Level 1</Text>
          </View>
        </View>
      </Card>

      {/* Quick Actions */}
      <View className="mb-6">
        <Text className="mb-4 text-lg font-bold text-gray-800">Quick Actions</Text>
        <View className="flex-row flex-wrap justify-between">
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              className={`w-[48%] items-center rounded-2xl bg-white p-6 ${index < 2 ? 'mb-4' : ''}`}
              style={{
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }}
              activeOpacity={0.8}
              accessible={true}
              accessibilityLabel={action.accessibilityLabel}
              accessibilityRole="button"
              onPress={action.onPress}>
              <LinearGradient
                colors={action.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="h-14 w-14 items-center justify-center "
                style={{
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                  borderRadius: 9999,
                }}>
                <Feather name={action.icon} size={28} color="white" />
              </LinearGradient>
              <Text className="mt-3 text-sm font-semibold text-forest">{action.title}</Text>
              <Text className="mt-1 text-xs text-gray-500">{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
};

export default FeedsScreen;
