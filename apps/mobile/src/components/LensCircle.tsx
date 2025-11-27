import { MotiView } from 'moti';
import { useCallback, useEffect, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

// Animated Google Lens-like circles overlay
const LensCircles: React.FC = () => {
  const CIRCLE_COUNT = 12;
  const { width, height } = useWindowDimensions();
  const gridSize = Math.ceil(Math.sqrt(CIRCLE_COUNT));
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;

  // Helper to generate a random circle config, each assigned to a unique grid cell
  const randomCircle = useCallback(
    (cellIdx: number) => {
      const col = cellIdx % gridSize;
      const row = Math.floor(cellIdx / gridSize);

      // Add randomness within the cell for natural look
      const x = col * cellWidth + cellWidth * 0.2 + Math.random() * (cellWidth * 0.6);
      const y = row * cellHeight + cellHeight * 0.2 + Math.random() * (cellHeight * 0.6);

      const size = Math.random() * 28 + 22; // Between 22 and 50
      const color = `rgba(255,255,255,${0.18 + Math.random() * 0.18})`;
      const scaleFactor = Math.random() * 0.18 + 0.08; // Between 0.08 and 0.26
      const scaleDirection = Math.random() < 0.5; // Randomly shrink or grow
      const duration = Math.random() * 900 + 1100; // Between 1100ms and 2000ms
      return { x, y, size, scaleFactor, scaleDirection, color, duration };
    },
    [gridSize, cellWidth, cellHeight],
  );

  // State for all circles
  const [circles, setCircles] = useState(() =>
    Array.from({ length: CIRCLE_COUNT }).map((_, idx) => ({
      ...randomCircle(idx),
      key: Math.random().toString(36).slice(2),
      delay: Math.random() * 800,
    })),
  );

  const onShrink = useCallback(
    (idx: number) => {
      setCircles((prev) => {
        const next = [...prev];
        next[idx] = {
          ...randomCircle(idx),
          key: Math.random().toString(36).slice(2),
          delay: Math.random() * 800,
        };
        return next;
      });
    },
    [randomCircle],
  );

  // Full-screen overlay container
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width,
        height,
        zIndex: 99,
      }}>
      {circles.map((circle, idx) => (
        <LensCircle {...circle} key={circle.key} idx={idx} onShrink={onShrink} />
      ))}
    </View>
  );
};

type LensCircleProps = {
  x: number;
  y: number;
  idx: number;
  size: number;
  color: string;
  delay: number;
  scaleFactor: number;
  scaleDirection: boolean; // true for grow, false for shrink
  duration: number;
  onShrink: (idx: number) => void;
  key: string;
};

const LensCircle: React.FC<LensCircleProps> = ({
  x,
  y,
  idx,
  size,
  color,
  duration,
  delay,
  scaleFactor,
  scaleDirection,
  onShrink,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        onShrink(idx);
        setVisible(true);
      }, 300); // match exit fade duration
    }, duration + delay);
    return () => clearTimeout(timer);
  }, [duration, delay, onShrink, idx]);

  const [fromScale, toScale] = scaleDirection ? [1, 1 + scaleFactor] : [1 + scaleFactor, 1];
  const [, toOpacity] = scaleDirection ? [0.7, 1] : [1, 0.7];

  return (
    <MotiView
      from={{ scale: fromScale, opacity: 0 }}
      animate={{
        scale: visible ? toScale : toScale,
        opacity: visible ? toOpacity : 0,
      }}
      transition={{
        type: 'timing',
        duration,
        delay,
        loop: false,
        repeatReverse: false,
        opacity: { type: 'timing', duration: 300 },
      }}
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
      pointerEvents="none"
    />
  );
};

export default LensCircles;
