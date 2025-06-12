import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons'; // or any icon lib
import { useAuth } from '~/context/AuthContext';

const HomeScreen = () => {
  const { user } = useAuth();
  return (
    <ScrollView className="p-4">
      <View className="pb-[100dp]">
        {/* Header */}
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-black">ReUseIt</Text>
          <Feather name="bell" size={20} color="gray" />
        </View>
        {/* Greeting */}
        <Text className="text-lg font-semibold text-black">Hi, {user?.displayName}! 👋</Text>
        <Text className="mb-4 text-sm text-gray-500">Ready to make a difference today?</Text>
        {/* Your Impact */}
        <View className="mb-6 rounded-xl bg-gray-100 p-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-base font-semibold text-black">Your Impact</Text>
            <Text className="font-bold text-green-600">850 pts</Text>
          </View>
          <Text className="mb-1 text-sm text-gray-500">7-day streak 🔥</Text>
          <View className="h-2 w-full rounded-full bg-gray-300">
            <View className="h-2 w-3/4 rounded-full bg-green-500" />
          </View>
        </View>
        {/* Buttons Grid */}
        <View className="mb-6 flex-row flex-wrap justify-between">
          <TouchableOpacity className="mb-3 w-[48%] items-center rounded-xl bg-gray-100 p-4">
            <Feather name="camera" size={24} color="black" />
            <Text className="mt-2 text-sm font-semibold text-black">Scan Item</Text>
          </TouchableOpacity>

          <TouchableOpacity className="mb-3 w-[48%] items-center rounded-xl bg-gray-100 p-4">
            <Feather name="map-pin" size={24} color="black" />
            <Text className="mt-2 text-sm font-semibold text-black">Find Centers</Text>
          </TouchableOpacity>

          <TouchableOpacity className="w-[48%] items-center rounded-xl bg-gray-100 p-4">
            <Feather name="users" size={24} color="black" />
            <Text className="mt-2 text-sm font-semibold text-black">Community</Text>
          </TouchableOpacity>

          <TouchableOpacity className="w-[48%] items-center rounded-xl bg-gray-100 p-4">
            <Feather name="bar-chart-2" size={24} color="black" />
            <Text className="mt-2 text-sm font-semibold text-black">Progress</Text>
          </TouchableOpacity>
        </View>
        {/* Upcoming Events */}
        <Text className="mb-3 text-base font-semibold text-black">Upcoming Events</Text>
        <View className="mb-3 rounded-xl bg-gray-100 p-4">
          <Text className="text-sm font-semibold text-black">Beach Cleanup</Text>
          <Text className="mt-1 text-xs text-green-600">This Saturday, 9 AM</Text>
        </View>
        <View className="rounded-xl bg-gray-100 p-4">
          <Text className="text-sm font-semibold text-black">Recycling Workshop</Text>
          <Text className="mt-1 text-xs text-blue-600">Next Tuesday, 2 PM</Text>
        </View>
        <View className="mb-3 rounded-xl bg-gray-100 p-4">
          <Text className="text-sm font-semibold text-black">Beach Cleanup</Text>
          <Text className="mt-1 text-xs text-green-600">This Saturday, 9 AM</Text>
        </View>
        <View className="rounded-xl bg-gray-100 p-4">
          <Text className="text-sm font-semibold text-black">Recycling Workshop</Text>
          <Text className="mt-1 text-xs text-blue-600">Next Tuesday, 2 PM</Text>
        </View>{' '}
        <View className="mb-3 rounded-xl bg-gray-100 p-4">
          <Text className="text-sm font-semibold text-black">Beach Cleanup</Text>
          <Text className="mt-1 text-xs text-green-600">This Saturday, 9 AM</Text>
        </View>
        <View className="rounded-xl bg-gray-100 p-4">
          <Text className="text-sm font-semibold text-black">Recycling Workshop</Text>
          <Text className="mt-1 text-xs text-blue-600">Next Tuesday, 2 PM</Text>
        </View>{' '}
        <View className="mb-3 rounded-xl bg-gray-100 p-4">
          <Text className="text-sm font-semibold text-black">Beach Cleanup</Text>
          <Text className="mt-1 text-xs text-green-600">This Saturday, 9 AM</Text>
        </View>
        <View className="rounded-xl bg-gray-100 p-4">
          <Text className="text-sm font-semibold text-black">Recycling Workshop</Text>
          <Text className="mt-1 text-xs text-blue-600">Next Tuesday, 2 PM</Text>
        </View>{' '}
        <View className="mb-3 rounded-xl bg-gray-100 p-4">
          <Text className="text-sm font-semibold text-black">Beach Cleanup</Text>
          <Text className="mt-1 text-xs text-green-600">This Saturday, 9 AM</Text>
        </View>
        <View className="rounded-xl bg-gray-100 p-4">
          <Text className="text-sm font-semibold text-black">Recycling Workshop</Text>
          <Text className="mt-1 text-xs text-blue-600">Next Tuesday, 2 PM</Text>
        </View>{' '}
        <View className="mb-3 rounded-xl bg-gray-100 p-4">
          <Text className="text-sm font-semibold text-black">Beach Cleanup</Text>
          <Text className="mt-1 text-xs text-green-600">This Saturday, 9 AM</Text>
        </View>
        <View className="rounded-xl bg-gray-100 p-4">
          <Text className="text-sm font-semibold text-black">Recycling Workshop</Text>
          <Text className="mt-1 text-xs text-blue-600">Next Tuesday, 2 PM</Text>
        </View>{' '}
        <View className="mb-3 rounded-xl bg-gray-100 p-4">
          <Text className="text-sm font-semibold text-black">Beach Cleanup</Text>
          <Text className="mt-1 text-xs text-green-600">This Saturday, 9 AM</Text>
        </View>
        <View className="rounded-xl bg-gray-100 p-4">
          <Text className="text-sm font-semibold text-black">Recycling Workshop</Text>
          <Text className="mt-1 text-xs text-blue-600">Next Tuesday, 2 PM</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
