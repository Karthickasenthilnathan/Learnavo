/**
 * AnimatedCheckmark — Full-screen success animation
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors, FontSizes, Spacing } from '../theme/colors';

export default function AnimatedCheckmark({ markedAt, onComplete }) {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [ringAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.sequence([
      // Ring expands
      Animated.timing(ringAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Checkmark scales in
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }),
      // Text fades in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-close after 2.5 seconds
    const timeout = setTimeout(() => {
      onComplete?.();
    }, 2500);

    return () => clearTimeout(timeout);
  }, []);

  const ringScale = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const formattedTime = markedAt
    ? new Date(markedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--';

  return (
    <View style={styles.container}>
      {/* Outer glow ring */}
      <Animated.View
        style={[
          styles.outerRing,
          {
            transform: [{ scale: ringScale }],
            opacity: ringAnim,
          },
        ]}
      />

      {/* Checkmark circle */}
      <Animated.View
        style={[
          styles.checkCircle,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.checkIcon}>✓</Text>
      </Animated.View>

      {/* Success text */}
      <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Attendance Marked!</Text>
        <Text style={styles.time}>at {formattedTime}</Text>
        <Text style={styles.subtitle}>
          You're all set. Your attendance has been recorded.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  outerRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.emerald500,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.emerald500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 15,
    marginBottom: 32,
  },
  checkIcon: {
    fontSize: 56,
    color: Colors.white,
    fontWeight: '800',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  time: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.emerald400,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
