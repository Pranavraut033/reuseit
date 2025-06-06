import Icon from '@react-native-vector-icons/fontawesome6';
import { StyleSheet } from 'react-native';

export const TabBarIcon = (props: React.ComponentProps<typeof Icon>) => {
  return <Icon size={24} className="text-primary" color={'#34A853'} {...props} />;
};
