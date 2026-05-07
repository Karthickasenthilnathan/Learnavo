/**
 * BLEScanner — Real BLE scan UI using react-native-ble-manager
 *
 * Scans for the classroom beacon UUID advertised by nRF Connect,
 * collects RSSI readings, and determines proximity pass/fail.
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { Colors, FontSizes, Spacing, BorderRadius } from '../theme/colors';
import { performBLEScan } from '../utils/bleService';
import { RSSI_THRESHOLD, SCAN_DURATION_MS } from '../config/beacon';

export default function BLEScanner({ onScanComplete, onError }) {
  const [status, setStatus] = useState('scanning'); // scanning, passed, failed
  const [rssiMedian, setRssiMedian] = useState(null);
  const [readingsCount, setReadingsCount] = useState(0);
  const [beaconFound, setBeaconFound] = useState(false);
  const [beaconName, setBeaconName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);

  const [spinAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(0.3));
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start spinner
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();

    // Start pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: SCAN_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Run REAL BLE scan
    startRealScan();

    return () => {
      spin.stop();
      pulse.stop();
    };
  }, []);

  const startRealScan = async () => {
    try {
      setStatus('scanning');
      setBeaconFound(false);
      setReadingsCount(0);
      setProgress(0);

      // Reset progress animation
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: SCAN_DURATION_MS,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      const result = await performBLEScan(1, (progressData) => {
        // Live progress updates from the BLE service
        if (progressData.found) {
          setBeaconFound(true);
          setBeaconName(progressData.deviceName || 'Beacon');
        }
        setReadingsCount(progressData.rssiReadings?.length || 0);
      });

      setRssiMedian(result.rssiMedian);
      setBeaconName(result.deviceName || 'Beacon');

      if (result.passed) {
        setStatus('passed');
        setTimeout(() => onScanComplete(result.rssiMedian), 800);
      } else {
        setStatus('failed');
        setErrorMessage(
          `Signal too weak: ${result.rssiMedian} dBm (need ≥ ${RSSI_THRESHOLD} dBm). Move closer to the beacon.`
        );
        onError?.('BLE signal too weak — move closer to the classroom beacon');
      }
    } catch (err) {
      console.warn('[BLEScanner] Scan error:', err.message);
      setStatus('failed');
      setErrorMessage(err.message);
      onError?.(err.message);
    }
  };

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {status === 'scanning' && (
        <>
          {/* Animated scanner */}
          <View style={styles.scannerContainer}>
            <Animated.View
              style={[
                styles.scannerRing,
                styles.scannerRingOuter,
                { opacity: pulseAnim },
              ]}
            />
            <Animated.View
              style={[
                styles.scannerRing,
                styles.scannerRingMiddle,
                { opacity: pulseAnim },
              ]}
            />
            <View style={styles.scannerCenter}>
              <Animated.Text
                style={[
                  styles.scannerIcon,
                  { transform: [{ rotate: spinInterpolate }] },
                ]}
              >
                📡
              </Animated.Text>
            </View>
          </View>

          <Text style={styles.title}>Scanning for Beacon...</Text>
          <Text style={styles.subtitle}>
            Verifying your proximity to the classroom
          </Text>

          {/* Live BLE badge */}
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE BLE SCAN</Text>
          </View>

          {/* Scan progress bar */}
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[styles.progressBarFill, { width: progressWidth }]}
            />
          </View>

          {/* Live stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {beaconFound ? '✓' : '...'}
              </Text>
              <Text style={styles.statLabel}>
                {beaconFound ? beaconName : 'Searching'}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{readingsCount}</Text>
              <Text style={styles.statLabel}>RSSI Readings</Text>
            </View>
          </View>
        </>
      )}

      {status === 'passed' && (
        <>
          <View style={styles.successCircle}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
          <Text style={styles.title}>Proximity Verified!</Text>
          <Text style={styles.rssiText}>
            RSSI: {rssiMedian} dBm — within range
          </Text>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>
              📡 {beaconName} • {readingsCount} readings
            </Text>
          </View>
        </>
      )}

      {status === 'failed' && (
        <>
          <View style={styles.failCircle}>
            <Text style={styles.failIcon}>✕</Text>
          </View>
          <Text style={styles.failTitle}>
            {beaconFound ? 'Too Far from Classroom' : 'Beacon Not Found'}
          </Text>
          <Text style={styles.failSubtitle}>
            {errorMessage || (beaconFound
              ? 'Move closer to the classroom beacon and try again.'
              : 'Make sure nRF Connect is advertising the beacon UUID.')}
          </Text>
          {rssiMedian && (
            <Text style={styles.rssiFailText}>
              RSSI: {rssiMedian} dBm (need ≥ {RSSI_THRESHOLD} dBm)
            </Text>
          )}
          <TouchableOpacity
            style={styles.retryButton}
            onPress={startRealScan}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Retry Scan</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    flex: 1,
  },
  scannerContainer: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  scannerRing: {
    position: 'absolute',
    borderRadius: 200,
    borderWidth: 2,
    borderColor: Colors.emerald500,
  },
  scannerRingOuter: {
    width: 180,
    height: 180,
  },
  scannerRingMiddle: {
    width: 130,
    height: 130,
  },
  scannerCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16,185,129,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerIcon: {
    fontSize: 36,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.emerald500,
    marginRight: 8,
  },
  liveBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.emerald400,
    letterSpacing: 0.8,
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.emerald500,
    borderRadius: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: Spacing.lg,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 8,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.successBg,
    borderWidth: 3,
    borderColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  successIcon: {
    fontSize: 44,
    color: Colors.success,
    fontWeight: '800',
  },
  rssiText: {
    fontSize: FontSizes.sm,
    color: Colors.emerald400,
    fontWeight: '600',
    marginTop: 8,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  verifiedBadgeText: {
    fontSize: FontSizes.xs,
    color: Colors.emerald400,
    fontWeight: '600',
  },
  failCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dangerBg,
    borderWidth: 3,
    borderColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  failIcon: {
    fontSize: 44,
    color: Colors.danger,
    fontWeight: '800',
  },
  failTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.danger,
    marginBottom: 8,
    textAlign: 'center',
  },
  failSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  rssiFailText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  retryButton: {
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
});
