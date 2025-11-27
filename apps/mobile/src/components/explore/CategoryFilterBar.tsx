import { ScrollView } from 'react-native';

import { t } from '~/utils/i18n';

import { CategoryCard } from './CategoryCard';
import { CATEGORY_IMAGES, CategoryKey } from './utils';

export interface CategoryFilterBarProps {
  selected: CategoryKey | 'all';
  onSelect: (c: CategoryKey | 'all') => void;
}

const ORDER: (CategoryKey | 'all')[] = [
  // 'all',
  'general',
  'glass',
  'paper',
  'plastic',
  'clothes',
  'electronics',
  // 'batteries',
  'metal',
  'bulkyWaste',
];

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({ selected, onSelect }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ alignItems: 'center' }}
      className="px-4">
      {ORDER.map((id) => (
        <CategoryCard
          key={id}
          id={id}
          label={id === 'all' ? t('explore.filterAll') : t(`explore.categories.${id}`)}
          image={CATEGORY_IMAGES[id]}
          selected={selected === id}
          onPress={onSelect}
        />
      ))}
    </ScrollView>
  );
};
