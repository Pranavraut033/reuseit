import { Platform, View, Animated } from 'react-native';
import type { ComponentProps } from 'react';

// Platform-aware MotiView component
// On web: uses plain View (no animations)
// On native: lazy-loads moti for full animation support

let MotiView: any = View;
let useDynamicAnimation: any;
let useAnimationState: any;

// We don't require moti at module load time to avoid native module initialization on web
// Instead, we export a component that conditionally loads moti

const PlatformMotiView =
  Platform.OS === 'web'
    ? View
    : (props: any) => {
      // Lazy require moti only when component is actually rendered on native
      if (!useDynamicAnimation) {
        try {
          const Moti = require('moti');
          MotiView = Moti.MotiView;
          useDynamicAnimation = Moti.useDynamicAnimation;
          useAnimationState = Moti.useAnimationState;
        } catch (e) {
          console.warn('Failed to load moti, falling back to View', e);
          return <View {...props} />;
        }
      }
      return <MotiView {...props} />;
    };

// Export platform-aware MotiView
export { PlatformMotiView as MotiView };

// Type-safe exports for TypeScript
export type MotiViewProps = ComponentProps<typeof View>;
