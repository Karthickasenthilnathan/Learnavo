/**
 * BLE Service — RSSI Validation & Simulation
 * Validates proximity via RSSI median calculation.
 * Includes simulation mode for demo without physical beacons.
 */
import { BLE_RSSI_THRESHOLD, BLE_READING_COUNT } from '../utils/constants.js';

/**
 * Calculate median of RSSI readings.
 */
export function calculateRSSIMedian(readings) {
  if (!readings || readings.length === 0) return null;
  const sorted = [...readings].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Validate BLE proximity from RSSI readings.
 * Returns { valid, rssiMedian, reason }
 */
export function validateBLEProximity(rssiReadings, threshold = BLE_RSSI_THRESHOLD) {
  if (!rssiReadings || rssiReadings.length < 3) {
    return {
      valid: false,
      rssiMedian: null,
      reason: `Insufficient readings (need at least 3, got ${rssiReadings?.length || 0})`,
    };
  }

  const median = calculateRSSIMedian(rssiReadings);

  if (median < threshold) {
    return {
      valid: false,
      rssiMedian: median,
      reason: `RSSI median ${median} dBm below threshold ${threshold} dBm — too far from beacon`,
      flagType: 'weak_presence',
    };
  }

  return {
    valid: true,
    rssiMedian: median,
    reason: `RSSI median ${median} dBm — within range`,
  };
}

/**
 * Calculate RSSI consistency (standard deviation).
 * Lower σ = more consistent = more likely genuine.
 */
export function calculateRSSIConsistency(readings) {
  if (!readings || readings.length < 2) return 0;
  const mean = readings.reduce((a, b) => a + b, 0) / readings.length;
  const variance = readings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / readings.length;
  return Math.sqrt(variance);
}

/**
 * Simulate BLE readings for demo mode.
 * Generates realistic RSSI values based on scenario.
 */
export function simulateBLEReadings(scenario = 'normal') {
  const count = BLE_READING_COUNT;
  const readings = [];

  switch (scenario) {
    case 'normal':
      // Student in classroom, ~3-5m from beacon
      for (let i = 0; i < count; i++) {
        readings.push(-55 + Math.floor(Math.random() * 15) - 7); // -62 to -48
      }
      break;

    case 'edge':
      // Student at edge of range, ~7-8m
      for (let i = 0; i < count; i++) {
        readings.push(-70 + Math.floor(Math.random() * 10) - 5); // -75 to -65
      }
      break;

    case 'out_of_range':
      // Student outside classroom
      for (let i = 0; i < count; i++) {
        readings.push(-80 + Math.floor(Math.random() * 15) - 10); // -90 to -75
      }
      break;

    case 'spoofed':
      // Suspiciously perfect readings (too consistent)
      const base = -50;
      for (let i = 0; i < count; i++) {
        readings.push(base + Math.floor(Math.random() * 2)); // -50 to -49
      }
      break;

    default:
      return simulateBLEReadings('normal');
  }

  return readings;
}

/**
 * Estimate distance from RSSI using log-distance path loss model.
 */
export function estimateDistance(rssi, txPower = -59) {
  if (rssi === 0) return -1;
  const ratio = rssi / txPower;
  if (ratio < 1.0) {
    return Math.pow(ratio, 10);
  }
  return 0.89976 * Math.pow(ratio, 7.7095) + 0.111;
}
