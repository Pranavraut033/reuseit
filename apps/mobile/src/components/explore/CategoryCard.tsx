import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import cn from '~/utils/cn';

import { CategoryKey } from './utils';

export interface CategoryCardProps {
  id: CategoryKey | 'all';
  label: string;
  image: { uri: string };
  selected?: boolean;
  onPress: (id: CategoryCardProps['id']) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  id,
  label,
  image,
  selected,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(id)}
      className={cn('mr-3')}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      activeOpacity={0.8}>
      <View
        className={cn(
          'flex w-24 flex-col items-center overflow-hidden rounded-lg border bg-white shadow-soft',
          selected ? 'border-2 border-primary' : 'border border-gray-200',
        )}>
        <View>
          <Image source={image} className="h-24 w-24" resizeMode="cover" />
        </View>

        <Text
          numberOfLines={1}
          className={cn('px-2 text-center text-sm', {
            'font-bold text-primary': selected,
            'text-forest': !selected,
          })}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
