import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from 'react-native';

import cn from '~/utils/cn';

type FabButtonType = 'primary' | 'error' | 'neutral';
type FabButtonSize = 'regular' | 'small' | 'large';

type ReactNonPrimitiveNode = Exclude<React.ReactNode, string | number>;

type FabButtonProps = {
  activityIndicator?: ReactNonPrimitiveNode; // custom loading indicator
  children?: React.ReactNode; // allow badge or similar
  disabled?: boolean;
  hideOnScrollDown?: boolean; // whether to hide FAB on scroll down
  icon:
    | ReactNonPrimitiveNode
    | ((props: { size?: number; color?: string }) => ReactNonPrimitiveNode);
  iconColor?: string;
  iconSize?: number;
  loading?: boolean;
  setScrollHandler?: (handler?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void) => void;
  size?: FabButtonSize;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  type?: FabButtonType;
} & TouchableOpacityProps;

const typeClass: Record<FabButtonType, string> = {
  primary: 'bg-primary',
  error: 'bg-red-600',
  neutral: 'bg-gray-400',
};

const sizeConfig: Record<FabButtonSize, { fab: string; icon: number; text: string }> = {
  small: {
    fab: 'min-h-10 min-w-10 p-1',
    icon: 20,
    text: 'text-xs ml-1.5',
  },
  regular: {
    fab: 'min-h-14 min-w-14 p-3',
    icon: 14,
    text: 'text-sm ml-2',
  },
  large: {
    fab: 'min-h-16 min-w-16 p-3',
    icon: 28,
    text: 'text-base ml-3',
  },
};

export const FabButton = forwardRef<View, FabButtonProps>(
  (
    {
      activityIndicator,
      children,
      disabled = false,
      hideOnScrollDown = false,
      icon,
      iconColor,
      iconSize,
      loading = false,
      setScrollHandler,
      size = 'regular',
      style,
      testID,
      type = 'primary',
      ...touchableProps
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    const [isFabVisible, setIsFabVisible] = useState(true);
    const scrollOffsetY = useRef(0);

    const handleScroll = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!event?.nativeEvent?.contentOffset) {
          return;
        }

        const currentOffset = event.nativeEvent.contentOffset.y;
        const direction = currentOffset > scrollOffsetY.current ? 'down' : 'up';

        // Only update if scroll delta is significant (> 5px) to avoid jitter
        if (Math.abs(currentOffset - scrollOffsetY.current) > 5) {
          if (direction === 'down' && isFabVisible) {
            setIsFabVisible(false);
          } else if (direction === 'up' && !isFabVisible) {
            setIsFabVisible(true);
          }
        }

        scrollOffsetY.current = currentOffset;
      },
      [isFabVisible],
    );

    // Attach scroll listener if scrollRef and hideOnScrollDown are provided
    useEffect(() => {
      setScrollHandler?.(hideOnScrollDown ? handleScroll : undefined);
    }, [setScrollHandler, hideOnScrollDown, handleScroll]);

    const resolvedIconColor = useMemo(
      () => iconColor ?? (type === 'neutral' ? 'black' : 'white'),
      [iconColor, type],
    );

    const renderIcon = () => {
      if (!icon) return null;
      if (typeof icon === 'function') {
        return icon({ size: sizeConfig[size].icon, color: resolvedIconColor });
      }
      return icon;
    };

    const renderLoading = () =>
      activityIndicator ? (
        activityIndicator
      ) : (
        <ActivityIndicator size="small" color={resolvedIconColor} testID="fab-activity-indicator" />
      );

    if (hideOnScrollDown && !isFabVisible) {
      return null;
    }

    return (
      <TouchableOpacity
        ref={ref}
        activeOpacity={0.7}
        {...touchableProps}
        className={cn([
          'justify-center items-center flex flex-row',
          'shadow-lg z-[2] rounded-full',
          typeClass[type],
          sizeConfig[size].fab,
          isDisabled ? 'opacity-60' : '',
          (touchableProps as any).className ?? '',
        ])}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        testID={testID}
        style={[{ elevation: 8 }, style]}
      >
        <View>{loading ? renderLoading() : renderIcon()}</View>
        {typeof children == 'string' || typeof children == 'number' ? (
          <Text className={cn(sizeConfig[size].text)} style={{ color: resolvedIconColor }}>
            {children}
          </Text>
        ) : (
          children
        )}
      </TouchableOpacity>
    );
  },
);

FabButton.displayName = 'FabButton';
