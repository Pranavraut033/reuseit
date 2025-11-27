import { MotiView } from 'moti';
import React from 'react';
import { View } from 'react-native';

export const Viewfinder: React.FC = () => {
  return (
    <View
      style={{
        width: 160,
        height: 160,
        transform: [{ translateX: -80 }, { translateY: -110 }],
        position: 'absolute',
      }}
      className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 transform">
      <MotiView
        pointerEvents="none"
        style={{
          width: 160,
          height: 160,
        }}
        from={{ scale: 1, opacity: 1 }}
        animate={{ scale: 1.1, opacity: 0.75 }}
        transition={{
          type: 'timing',
          duration: 1000,
          loop: true,
          repeatReverse: true,
        }}>
        {/* Top Left Corner */}
        <View
          className="absolute left-0 top-0 h-10 w-10 rounded-tl-[10px]"
          style={{
            borderTopWidth: 4,
            borderLeftWidth: 4,
            borderColor: 'rgba(255,255,255,0.95)',
          }}
        />
        {/* Top Right Corner */}
        <View
          className="absolute right-0 top-0 h-10 w-10 rounded-tr-[10px]"
          style={{
            borderTopWidth: 4,
            borderRightWidth: 4,
            borderColor: 'rgba(255,255,255,0.95)',
          }}
        />
        {/* Bottom Left Corner */}
        <View
          className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-[10px]"
          style={{
            borderBottomWidth: 4,
            borderLeftWidth: 4,
            borderColor: 'rgba(255,255,255,0.95)',
          }}
        />
        {/* Bottom Right Corner */}
        <View
          className="absolute bottom-0 right-0 h-10 w-10 rounded-br-[10px]"
          style={{
            borderBottomWidth: 4,
            borderRightWidth: 4,
            borderColor: 'rgba(255,255,255,0.95)',
          }}
        />
      </MotiView>
    </View>
  );
};
