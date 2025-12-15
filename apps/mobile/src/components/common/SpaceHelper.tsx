import { Children, FC, ReactNode } from 'react';
import { View } from 'react-native';

// Small helper to implement spacing between children in a given direction
const spacingMap: Record<string, number> = {
  '3xs': 4,
  '2xs': 6,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

const Row: FC<{
  children: ReactNode;
  space?: number | keyof typeof spacingMap; // spacing in pixels or token key
  direction?: 'row' | 'column';
  className?: string;
  style?: any;
}> = ({ children, space = 'xs', direction = 'row', className, style }) => {
  const arr = Children.toArray(children);
  const isRow = direction === 'row';
  const resolvedSpace = typeof space === 'number' ? space : spacingMap[space];
  return (
    <View
      className={className}
      style={[{ flexDirection: isRow ? 'row' : 'column', alignItems: 'center' }, style]}>
      {arr.map((child, idx) => (
        <View
          key={idx}
          style={
            idx === arr.length - 1
              ? undefined
              : isRow
                ? { marginRight: resolvedSpace }
                : { marginBottom: resolvedSpace }
          }>
          {child}
        </View>
      ))}
    </View>
  );
};

export default Row;
