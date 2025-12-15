import React from 'react';
import { Text, View } from 'react-native';

type BadgeProps = {
  children?: React.ReactNode;
  variant?: 'primary' | 'success' | 'info' | 'earth';
  className?: string;
};

const variantClass: Record<NonNullable<BadgeProps['variant']>, string> = {
  primary: 'bg-primary',
  success: 'bg-primary',
  info: 'bg-secondary',
  earth: 'bg-earth-accent',
};

const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', className }) => {
  return (
    <View
      className={`items-center justify-center rounded-full px-2 py-1 ${variantClass[variant]} ${className || ''}`}>
      <Text className="text-xs font-semibold text-white">{children}</Text>
    </View>
  );
};

export default Badge;
