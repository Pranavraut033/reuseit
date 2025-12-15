import React from 'react';
import { Pressable, PressableProps, Text, View } from 'react-native';

type CardProps = {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
} & PressableProps;

const Card: React.FC<CardProps> = ({ title, subtitle, children, className, ...props }) => {
  return (
    <Pressable className={`rounded-lg bg-white p-md shadow-card ${className || ''}`} {...props}>
      {title ? <Text className="text-lg font-semibold text-forest">{title}</Text> : null}
      {subtitle ? <Text className="mt-2 text-gray-600">{subtitle}</Text> : null}
      {children ? <View className={title && subtitle ? 'mt-3' : ''}>{children}</View> : null}
    </Pressable>
  );
};

export default Card;
