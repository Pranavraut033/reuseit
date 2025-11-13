import { FC, ReactNode, Children } from "react";
import { View } from "react-native";




// Small helper to implement spacing between children in a given direction
const Row: FC<{
  children: ReactNode;
  space?: number; // spacing in pixels
  direction?: 'row' | 'column';
  className?: string;
  style?: any;
}> = ({ children, space = 8, direction = 'row', className, style }) => {
  const arr = Children.toArray(children);
  const isRow = direction === 'row';
  return (
    <View
      className={className}
      style={[
        { flexDirection: isRow ? 'row' : 'column', alignItems: 'center' },
        style,
      ]}
    >
      {arr.map((child, idx) => (
        <View
          key={idx}
          style={
            idx === arr.length - 1
              ? undefined
              : isRow
                ? { marginRight: space }
                : { marginBottom: space }
          }
        >
          {child}
        </View>
      ))}
    </View>
  );
};

export default Row;