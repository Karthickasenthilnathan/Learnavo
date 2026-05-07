/**
 * QRDisplay — Renders QR code with countdown timer
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors, FontSizes, Spacing, BorderRadius } from '../theme/colors';

export default function QRDisplay({ qrString, expiresAt, onExpired }) {
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Calculate initial seconds
    if (expiresAt) {
      const diff = Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
      setSecondsLeft(diff);
    }

    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpired?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  // Pulse animation for QR
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const progress = secondsLeft / 60;
  const isUrgent = secondsLeft <= 10;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Attendance Token</Text>
      <Text style={styles.subtitle}>
        Verification in progress...
      </Text>

      {/* QR Code with glow */}
      <Animated.View
        style={[styles.qrContainer, { transform: [{ scale: pulseAnim }] }]}
      >
        <View style={styles.qrInner}>
          {qrString ? (
            <QRCode
              value={qrString}
              size={220}
              backgroundColor={Colors.white}
              color="#1A3C5E"
              ecl="H"
            />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrPlaceholderText}>Generating...</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Countdown timer */}
      <View style={styles.timerContainer}>
        <View style={styles.timerBarBg}>
          <View
            style={[
              styles.timerBarFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: isUrgent ? Colors.danger : Colors.emerald500,
              },
            ]}
          />
        </View>
        <Text
          style={[
            styles.timerText,
            { color: isUrgent ? Colors.danger : Colors.emerald400 },
          ]}
        >
          {secondsLeft}s remaining
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.emerald400,
    marginBottom: Spacing.xxl,
  },
  qrContainer: {
    padding: 4,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(16,185,129,0.15)',
    shadowColor: Colors.emerald500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  qrInner: {
    padding: 20,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholderText: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
  },
  timerContainer: {
    width: '100%',
    marginTop: Spacing.xxl,
    alignItems: 'center',
  },
  timerBarBg: {
    width: '80%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  timerBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  timerText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
});
