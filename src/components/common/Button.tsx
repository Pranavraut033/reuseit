import { forwardRef, memo, useMemo } from 'react';
import {
  Text,
  Pressable,
  PressableProps,
  View,
  ActivityIndicator,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import cn from '~/src/utils/cn';

type ButtonType = 'primary' | 'error' | 'neutral';

type ButtonSize = 'small' | 'medium' | 'large';

type ButtonProps = {
  activityIndicator?: React.ReactNode; // custom loading indicator
  children?: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode | ((props: { size?: number; color?: string }) => React.ReactNode);
  iconColor?: string;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
  loading?: boolean;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle> | string;
  testID?: string;
  textClassName?: string;
  textStyle?: StyleProp<TextStyle> | string;
  title?: string;
  type?: ButtonType;
} & PressableProps;

const typeClass: Record<ButtonType, string> = {
  primary: 'bg-primary',
  error: 'bg-red-600',
  neutral: 'bg-gray-400',
};

const textTypeClass: Record<ButtonType, string> = {
  primary: 'text-white',
  error: 'text-white',
  neutral: 'text-black',
};

const sizeClass: Record<ButtonSize, string> = {
  small: 'p-2 min-h-8',
  medium: 'p-4 min-h-12',
  large: 'p-6 min-h-16',
};

const textSizeClass: Record<ButtonSize, string> = {
  small: 'text-sm',
  medium: 'text-lg',
  large: 'text-xl',
};

const ButtonComponent = forwardRef<View, ButtonProps>(
  (
    {
      activityIndicator,
      children,
      className,
      disabled = false,
      icon,
      iconColor,
      iconPosition = 'left',
      iconSize,
      loading = false,
      size = 'medium',
      style,
      testID,
      textClassName,
      textStyle,
      title,
      type = 'primary',
      ...touchableProps
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const defaultIconSize = { small: 16, medium: 20, large: 24 }[size];
    const finalIconSize = iconSize ?? defaultIconSize;

    const [buttonClassName, computedTextClassName, iconMarginClass, resolvedIconColor] = useMemo(
      () => [
        cn(
          'items-center justify-center shadow-md rounded-lg flex-row',
          typeClass[type],
          sizeClass[size],
          isDisabled ? 'opacity-60' : '',
          className || ''
        ),
        cn(
          'font-semibold text-center',
          textSizeClass[size],
          textTypeClass[type],
          isDisabled ? 'text-gray-300' : '',
          textClassName
        ),
        iconPosition === 'left' ? 'mr-2' : 'ml-2',
        iconColor || (type === 'neutral' ? 'black' : 'white'),
      ],
      [type, size, isDisabled, className, textClassName, iconPosition, iconColor]
    );

    const renderIcon = () => {
      if (!icon) return null;
      if (typeof icon === 'function') {
        return (
          <View className={iconMarginClass}>
            {icon({ size: finalIconSize, color: resolvedIconColor })}
          </View>
        );
      }
      return <View className={iconMarginClass}>{icon}</View>;
    };

    const renderLoading = () =>
      activityIndicator ? (
        activityIndicator
      ) : (
        <ActivityIndicator
          size="small"
          color={resolvedIconColor}
          style={iconPosition === 'left' ? { marginRight: 8 } : { marginLeft: 8 }}
          testID="button-activity-indicator"
        />
      );

    return (
      <Pressable
        ref={ref}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: false }}
        {...touchableProps}
        className={buttonClassName}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        testID={testID}
        style={style}>
        {iconPosition === 'left' && (loading ? renderLoading() : renderIcon())}
        {title || typeof children == 'string' || typeof children == 'number' ? (
          <Text
            className={computedTextClassName}
            numberOfLines={1}
            ellipsizeMode="tail"
            style={typeof textStyle !== 'string' ? textStyle : undefined}>
            {title || children}
          </Text>
        ) : (
          children
        )}
        {iconPosition === 'right' && (loading ? renderLoading() : renderIcon())}
      </Pressable>
    );
  }
);

ButtonComponent.displayName = 'Button';

export const Button = memo(ButtonComponent);
