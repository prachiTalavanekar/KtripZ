import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

function SkeletonItem() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.icon} />
      <View style={styles.lines}>
        <View style={styles.lineL} />
        <View style={styles.lineS} />
      </View>
    </Animated.View>
  );
}

export default function LoadingSkeleton({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItem key={i} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.card, borderRadius: SIZES.radius,
    padding: 14, marginBottom: 10,
  },
  icon: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.border },
  lines: { flex: 1, gap: 8 },
  lineL: { height: 14, borderRadius: 6, backgroundColor: COLORS.border, width: '75%' },
  lineS: { height: 10, borderRadius: 6, backgroundColor: COLORS.border, width: '45%' },
});
