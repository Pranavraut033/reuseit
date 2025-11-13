import { View, Text, ScrollView } from 'react-native';
import { useAuth } from '~/src/context/AuthContext';
import { Container } from '~/src/components/common/Container';
import { useQuery } from '@apollo/client/react';
import { GET_USER_POINTS } from '~/src/gql/points/getUserPoints';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

const PointsScreen = () => {
  const { user } = useAuth();
  const { data, loading, error } = useQuery(GET_USER_POINTS, {
    variables: { id: user?.id || '' },
    skip: !user?.id,
    fetchPolicy: 'cache-and-network',
  });
  const points = data?.user?.points ?? 0;
  const pointsHistory = data?.user?.pointsHistory ?? [];

  return (
    <Container paddingForTabs>
      {/* Header Card with User Info */}
      <View className="mb-6 mt-4 rounded-2xl bg-white p-6 shadow-md">
        <View className="items-center">
          <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-amber-100">
            <FontAwesome5 name="trophy" size={40} color="#D97706" />
          </View>
          <Text className="text-2xl font-bold text-gray-800">{user?.name || 'Player'}</Text>
          <View className="mt-2 rounded-full bg-purple-100 px-4 py-1">
            <Text className="text-sm font-semibold text-purple-700">
              Level {Math.floor(points / 100) + 1}
            </Text>
          </View>
        </View>

        {/* Points Display */}
        <View className="mt-4 items-center border-t border-gray-200 pt-4">
          <View className="flex-row items-center">
            <FontAwesome5 name="star" size={24} color="#10B981" />
            <Text className="mx-3 text-5xl font-extrabold text-green-600">{points}</Text>
            <MaterialCommunityIcons name="medal" size={24} color="#F59E0B" />
          </View>
          <Text className="mt-2 text-sm text-gray-600">Total Points</Text>
        </View>

        {/* Progress to Next Level */}
        <View className="mt-4 rounded-lg bg-gray-50 p-3">
          <View className="flex-row justify-between">
            <Text className="text-sm font-medium text-gray-700">Next Level Progress</Text>
            <Text className="text-sm font-bold text-amber-600">
              {100 - (points % 100)} XP needed
            </Text>
          </View>
          <View className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
            <View
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
              style={{ width: `${points % 100}%` }}
            />
          </View>
        </View>
      </View>

      {/* Points History Section */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-gray-800">Points History</Text>
        <FontAwesome5 name="history" size={20} color="#6B7280" />
      </View>

      {loading && (
        <View className="items-center py-8">
          <Text className="text-gray-600">Loading your achievements...</Text>
        </View>
      )}

      {error && (
        <View className="rounded-lg bg-red-50 p-4">
          <Text className="text-center font-medium text-red-700">
            Failed to load points history
          </Text>
        </View>
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {pointsHistory.length === 0 && !loading && (
          <View className="mt-12 items-center rounded-xl bg-white p-8 shadow-sm">
            <MaterialCommunityIcons name="star-outline" size={48} color="#D1D5DB" />
            <Text className="mt-4 text-center text-base text-gray-600">
              No points earned yet.{'\n'}Start contributing to earn rewards!
            </Text>
          </View>
        )}

        {pointsHistory.map((entry: any) => (
          <View
            key={entry.id}
            className="mb-3 flex-row items-center rounded-xl bg-white p-4 shadow-sm"
            accessible={true}
            accessibilityLabel={`Earned ${entry.amount} points for ${entry.reason.replace('_', ' ')}`}
            accessibilityRole="text">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <FontAwesome5 name="star" size={18} color="#10B981" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-base font-semibold capitalize text-gray-800">
                {entry.reason.replace(/_/g, ' ')}
              </Text>
              <Text className="mt-1 text-lg font-bold text-green-600">+{entry.amount} XP</Text>
              <Text className="mt-1 text-xs text-gray-500">
                {new Date(entry.createdAt).toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
        {/* Bottom padding for scroll */}
        <View className="h-6" />
      </ScrollView>
    </Container>
  );
};

export default PointsScreen;
