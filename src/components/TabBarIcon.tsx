import { FontAwesome6 as Icon } from '@expo/vector-icons';

export const TabBarIcon = (props: React.ComponentProps<typeof Icon>) => {
  return <Icon size={22} className="text-primary" color={'#34A853'} {...props} />;
};
