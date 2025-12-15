import React from 'react';
import { View } from 'react-native';

type ProgressBarProps = {
  progress: number; // 0 - 100
  height?: number;
  className?: string;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, height = 8, className }) => {
  const clamped = Math.max(0, Math.min(100, progress));
  return (
    <View
      className={`w-full overflow-hidden rounded-full bg-gray-200 ${className || ''}`}
      style={{ height }}>
      <View className="h-full rounded-full bg-primary" style={{ width: `${clamped}%` }} />
    </View>
  );
};

export default ProgressBar;
