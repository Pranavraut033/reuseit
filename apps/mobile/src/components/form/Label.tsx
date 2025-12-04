import React from 'react';
import { Text } from 'react-native';

interface LabelProps {
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}

export const Label: React.FC<LabelProps> = ({ children, className = '', required = false }) => {
  return (
    <Text className={`mb-2 text-[15px] font-semibold text-gray-800 ${className}`}>
      {children}
      {required && <Text className="text-red-500">*</Text>}
    </Text>
  );
};
