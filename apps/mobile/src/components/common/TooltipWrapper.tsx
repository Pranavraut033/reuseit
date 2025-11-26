import React, { PropsWithChildren, ReactNode, useState } from 'react';
import { Platform, Pressable, TextStyle, View, ViewStyle } from 'react-native';
import * as Tooltip from 'universal-tooltip';

type TooltipWrapperProps = PropsWithChildren<{
  content: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
  triggerProps?: object;
}>;

const TriggerView = Platform.OS === 'web' ? View : Pressable;

export const TooltipWrapper: React.FC<TooltipWrapperProps> = ({
  children,
  content,
  side = 'top',
  containerStyle,
  textStyle,
  triggerProps,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip.Root
      {...Platform.select({
        web: {},
        default: {
          open,
          onDismiss: () => setOpen(false),
        },
      })}
    >
      <Tooltip.Trigger>
        <TriggerView
          {...Platform.select({
            web: {},
            default: {
              onPress: () => setOpen(true),
              open,
            },
          })}
          {...triggerProps}
        >
          {children}
        </TriggerView>
      </Tooltip.Trigger>
      <Tooltip.Content
        sideOffset={3}
        containerStyle={{
          ...containerStyle,
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 8,
          paddingBottom: 8,
        }}
        onTap={() => setOpen(false)}
        dismissDuration={500}
        disableTapToDismiss
        side={side}
        presetAnimation="fadeIn"
        backgroundColor="black"
        borderRadius={12}
      >
        {typeof content === 'string' ? (
          <Tooltip.Text text={content} style={{ color: '#fff', fontSize: 16, ...textStyle }} />
        ) : (
          content
        )}
      </Tooltip.Content>
    </Tooltip.Root>
  );
};
