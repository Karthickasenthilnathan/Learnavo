/**
 * Beacon Configuration — nRF Connect Advertiser Setup
 *
 * This UUID must match the one you configure in nRF Connect app's Advertiser.
 * The student app scans for BLE peripherals advertising a service with this UUID.
 *
 * HOW TO SET UP nRF Connect:
 * 1. Open nRF Connect on a second phone
 * 2. Go to Advertiser tab (bottom nav)
 * 3. Tap "+" to create new advertiser
 * 4. Add "Complete List of 128-bit Service UUIDs"
 * 5. Enter: 12345678-1234-5678-9ABC-DEF012345678
 * 6. Set advertise mode to "Low Latency"
 * 7. Set TX power to "High"
 * 8. Tap the switch to START advertising
 */

// ──────────────────────────────────────────────
// CLASSROOM BEACON UUID — Must match nRF Connect
// ──────────────────────────────────────────────
export const BEACON_UUID = '12345678-1234-5678-9abc-def012345678';

// RSSI threshold — student must be within ~5m of beacon
// More negative = farther allowed; -70 is roughly 5 meters indoors
export const RSSI_THRESHOLD = -70;

// Scan duration in milliseconds
export const SCAN_DURATION_MS = 8000;

// Minimum number of RSSI readings required to compute a valid median
export const MIN_READINGS = 3;

// Mapping of classroom IDs to beacon UUIDs (extensible for multi-classroom)
// For jury demo, all classrooms use the same single beacon
export const CLASSROOM_BEACONS = {
  1: BEACON_UUID,
  2: BEACON_UUID,
  3: BEACON_UUID,
};
