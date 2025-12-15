import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ColorValue, Image, Text, View } from 'react-native';

function getRandomAvatar(userName: string): ColorValue {
  let hash = 0;
  for (let i = 0; i < userName.length; i++) {
    hash = userName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

interface User {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

const AvatarIcon: React.FC<{
  user?: User | null;
  anonymous?: boolean;
  size?: number;
}> = ({ user, anonymous = false, size = 40 }) => {
  const avatarUrl = user?.avatarUrl;

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const textSize = size * 0.5;

  if (anonymous) {
    return (
      <View
        style={[containerStyle]}
        className="items-center justify-center overflow-hidden bg-canvas">
        <MaterialCommunityIcons name="incognito" size={size * 0.6} color="#34495E" />
      </View>
    );
  }

  if (avatarUrl) {
    return (
      <View style={containerStyle} className="overflow-hidden">
        <Image source={{ uri: avatarUrl }} className="h-full w-full" />
      </View>
    );
  } else if (user) {
    return (
      <View
        style={[containerStyle, { backgroundColor: getRandomAvatar(user.name) }]}
        className="items-center justify-center overflow-hidden">
        <Text
          style={{ fontSize: textSize, color: 'white', fontWeight: 'bold' }}
          className="text-center">
          {user.name.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  } else {
    return (
      <View
        style={containerStyle}
        className="items-center justify-center overflow-hidden bg-canvas">
        <Ionicons name="leaf" size={size * 0.6} color="#34495E" />
      </View>
    );
  }
};

export default AvatarIcon;
