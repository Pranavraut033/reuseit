import React, { forwardRef, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';

import cn from '~/utils/cn';

/**
 * Flat style icon-only button.
 * - Minimal padding, no elevation, transparent background by default.
 * - Supports disabled + loading states.
 * - Accepts render prop/function or ReactNode icon.
 */
type IconButtonProps = {
  icon: React.ReactNode | ((props: { size: number; color: string }) => React.ReactNode);
  size?: number; // icon size
  color?: string; // icon color
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle> | string;
  testID?: string;
  activityIndicator?: React.ReactNode;
  hitSlop?: number | { top?: number; bottom?: number; left?: number; right?: number };
} & Omit<PressableProps, 'style'>;

const IconButton = forwardRef<View, IconButtonProps>(
  (
    {
      icon,
      size = 24,
      color = '#34495E',
      loading = false,
      disabled = false,
      accessibilityLabel,
      style,
      testID,
      activityIndicator,
      className,
      hitSlop = 8,
      ...pressableProps
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    const [wrapperClassName, resolvedColor, touchSize] = useMemo(() => {
      const baseTouch = Math.max(size + 16, 44); // ensure 44px min touch target
      return [
        cn(
          'items-center justify-center rounded-full',
          'active:opacity-70',
          isDisabled ? 'opacity-40 pointer-events-none' : '',
          typeof style === 'string' ? style : '',
          className || '',
        ),
        color,
        baseTouch,
      ];
    }, [isDisabled, style, className, color, size]);

    const renderIcon = () => {
      if (loading) return renderLoading();
      if (!icon) return null;
      if (typeof icon === 'function') {
        return icon({ size, color: resolvedColor || '#222' });
      }
      return icon;
    };

    const renderLoading = () =>
      activityIndicator ? (
        activityIndicator
      ) : (
        <ActivityIndicator size="small" color={resolvedColor || '#666'} />
      );

    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        accessibilityLabel={accessibilityLabel}
        disabled={isDisabled}
        className={wrapperClassName}
        testID={testID}
        hitSlop={hitSlop}
        android_ripple={{ color: 'rgba(0,0,0,0.12)', borderless: true }}
        {...pressableProps}
        style={({ pressed }) => [
          typeof style !== 'string' ? style : undefined,
          pressed && {
            opacity: 0.7,
          },
          { width: touchSize, height: touchSize },
        ]}>
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          {renderIcon()}
        </View>
      </Pressable>
    );
  },
);

IconButton.displayName = 'IconButton';

/**
 * Example usage:
 * <IconButton
 *   icon={({ size, color }) => <FontAwesome name='plus' size={size} color={color} />}
 *   color='#007AFF'
 *   onPress={() => {}}
 *   accessibilityLabel='Add item'
 * />
 */
export default IconButton;
