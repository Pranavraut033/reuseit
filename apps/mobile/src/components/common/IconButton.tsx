import React, { forwardRef, useMemo } from 'react';
import {
  Pressable,
  ActivityIndicator,
  View,
  PressableProps,
  ViewStyle,
  StyleProp,
} from 'react-native';
import cn from '~/utils/cn';

/**
 * Flat style icon-only button.
 * - Minimal padding, no elevation, transparent background by default.
 * - Supports disabled + loading states.
 * - Accepts render prop/function or ReactNode icon.
 */
export type IconButtonProps = {
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

export const IconButton = forwardRef<View, IconButtonProps>(
  (
    {
      icon,
      size = 24,
      color = '#222',
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
    ref
  ) => {
    const isDisabled = disabled || loading;

    const [wrapperClassName, resolvedColor] = useMemo(
      () => [
        cn(
          'items-center justify-center rounded-md',
          'active:opacity-70',
          isDisabled ? 'opacity-40' : '',
          typeof style === 'string' ? style : '',
          className || ''
        ),
        color,
      ],
      [isDisabled, style, className, color]
    );

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
        ]}>
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          {renderIcon()}
        </View>
      </Pressable>
    );
  }
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
