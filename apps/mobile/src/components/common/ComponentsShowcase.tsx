import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import AvatarIcon from './AvatarIcon';
import Badge from './Badge';
import { Button } from './Button';
import Card from './Card';
import IconButton from './IconButton';
import ProgressBar from './ProgressBar';

const ComponentsShowcase: React.FC = () => {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text className="mb-4 text-lg font-semibold text-forest">Components Showcase</Text>

      <Card title="Buttons" subtitle="Primary, Secondary and Outline">
        <View className="flex-row items-center space-x-3">
          <Button title="Primary" type="primary" />
          <Button title="Neutral" type="neutral" />
          <Button title="Error" type="error" />
        </View>
      </Card>

      <Card title="Badges" subtitle="Status and rewards" className="mt-4">
        <View className="flex-row items-center space-x-3">
          <Badge>New</Badge>
          <Badge variant="earth">4pts</Badge>
          <Badge variant="info">Info</Badge>
        </View>
      </Card>

      <Card title="Progress" className="mt-4">
        <ProgressBar progress={45} />
      </Card>

      <Card title="Avatars" className="mt-4">
        <View className="flex-row items-center space-x-3">
          <AvatarIcon size={48} />
          <AvatarIcon user={{ id: '1', name: 'Alex' }} size={48} />
          <AvatarIcon anonymous size={48} />
        </View>
      </Card>

      <Card title="Icon Button" className="mt-4">
        <View className="flex-row items-center space-x-3">
          <IconButton
            icon={({ size, color }) => <Text style={{ fontSize: size, color }}>★</Text>}
          />
        </View>
      </Card>
    </ScrollView>
  );
};

export default ComponentsShowcase;
