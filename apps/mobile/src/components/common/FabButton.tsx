import { forwardRef, useMemo } from 'react';
import {
  ActivityIndicator,
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
  type?: FabButtonType;
  icon:
  | ReactNonPrimitiveNode
  | ((props: { size?: number; color?: string }) => ReactNonPrimitiveNode);
  iconSize?: number;
  iconColor?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode; // allow badge or similar
  activityIndicator?: ReactNonPrimitiveNode; // custom loading indicator
  size?: FabButtonSize;
} & TouchableOpacityProps;

export const FabButton = forwardRef<View, FabButtonProps>(
  (
    {
      type = 'primary',
      icon,
      iconSize,
      iconColor,
      loading = false,
      disabled = false,
      style,
      testID,
      children,
      activityIndicator,
      size = 'regular',
      ...touchableProps
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    // FAB size and icon size
    const sizeConfig = useMemo(() => {
      if (size === 'small') return { diameter: 40, icon: iconSize ?? 20 };
      if (size === 'large') return { diameter: 72, icon: iconSize ?? 32 };
      return { diameter: 56, icon: iconSize ?? 24 };
    }, [size, iconSize]);

    // FAB background color
    const typeClass = useMemo(
      () =>
        ({
          primary: 'bg-primary',
          error: 'bg-red-600',
          neutral: 'bg-gray-400',
        }) as Record<FabButtonType, string>,
      []
    );

    // FAB shadow and shape
    const fabClassName = useMemo(
      () =>
        cn([
          'justify-center items-center',
          'shadow-lg z-[2]',
          typeClass[type],
          isDisabled ? 'opacity-60' : '',
          (touchableProps as any).className ?? '',
        ])
      ,
      [type, typeClass, isDisabled, touchableProps]
    );

    const resolvedIconColor = useMemo(
      () => iconColor ?? (type === 'neutral' ? 'black' : 'white'),
      [iconColor, type]
    );

    const renderIcon = () => {
      if (!icon) return null;
      if (typeof icon === 'function') {
        return icon({ size: sizeConfig.icon, color: resolvedIconColor });
      }
      return icon;
    };

    const renderLoading = () =>
      activityIndicator ? (
        activityIndicator
      ) : (
        <ActivityIndicator size="small" color={resolvedIconColor} testID="fab-activity-indicator" />
      );

    return (
      <TouchableOpacity
        ref={ref}
        activeOpacity={0.7}
        {...touchableProps}
        className={fabClassName}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        testID={testID}
        style={[
          {
            elevation: 8,
            width: sizeConfig.diameter,
            height: sizeConfig.diameter,
            borderRadius: sizeConfig.diameter / 2,
          },
          style,
        ]}>
        <View>{loading ? renderLoading() : renderIcon()}</View>
        {typeof children == 'string' || typeof children == 'number' ? (
          <Text>{children}</Text>
        ) : (
          children
        )}
      </TouchableOpacity>
    );
  }
);

FabButton.displayName = 'FabButton';
