import { useEffect, useState } from 'react';
import { Animated, type DimensionValue } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
}

// Lightweight pulsing placeholder — the RN replacement for the boneyard-js
// skeletons. Uses the RN Animated driver (no worklets needed).
export function Skeleton({ width = '100%', height = 16, radius = 8 }: SkeletonProps) {
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.base, { width, height, borderRadius: radius, opacity }]} />;
}

const styles = StyleSheet.create((theme) => ({
  base: {
    backgroundColor: theme.colors.surfacePanelStrong,
  },
}));
