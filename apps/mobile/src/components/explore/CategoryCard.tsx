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
    <TouchableOpacity onPress={() => onPress(id)} className={cn('mr-2')}>
      <View
        className={cn(
          { 'border-primary': selected },
          ' border-black/24  flex w-24 flex-col  items-center overflow-hidden rounded-3xl border bg-gray-200/80 shadow-md shadow-primary ',
        )}>
        <View>
          <Image source={image} className="h-24 w-24" resizeMode="cover" />
        </View>

        <Text
          numberOfLines={1}
          className={cn('px-2 text-center text-sm text-black', {
            'font-bold text-primary': selected,
          })}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
