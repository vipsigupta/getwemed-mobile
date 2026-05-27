import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

/**
 * Reusable blinking ✦ ✦ ✦ stars row, used across all screens.
 * Each star blinks with a staggered delay for a "twinkling" effect.
 */
export default function BlinkingStars() {
  const star1 = useRef(new Animated.Value(1)).current;
  const star2 = useRef(new Animated.Value(0.3)).current;
  const star3 = useRef(new Animated.Value(0.6)).current;

  const blink = (anim: Animated.Value, delay: number) => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 0.15, duration: 600, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  useEffect(() => {
    blink(star1, 0);
    blink(star2, 300);
    blink(star3, 600);
  }, []);

  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Animated.Text style={[styles.star, { opacity: star1 }]}>✦</Animated.Text>
      <Animated.Text style={[styles.star, { opacity: star2 }]}>✦</Animated.Text>
      <Animated.Text style={[styles.star, { opacity: star3 }]}>✦</Animated.Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  line: {
    height: 1,
    width: 50,
    backgroundColor: '#D4AF37',
    marginHorizontal: 10,
    opacity: 0.5,
  },
  star: {
    color: '#D4AF37',
    fontSize: 14,
    marginHorizontal: 3,
  },
});
