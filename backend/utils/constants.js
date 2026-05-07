export const QR_ROTATION_SECONDS = parseInt(process.env.QR_ROTATION_SECONDS || '30');
export const BLE_RSSI_THRESHOLD = parseInt(process.env.BLE_RSSI_THRESHOLD || '-75');
export const BLE_READING_COUNT = parseInt(process.env.BLE_READING_COUNT || '10');
export const BLE_PROXIMITY_METERS = parseInt(process.env.BLE_PROXIMITY_METERS || '8');
export const CLUSTER_SYNC_WINDOW_MS = 3000;      // 3-second window
export const CLUSTER_SYNC_MIN_STUDENTS = 5;       // 5+ students
export const DUPLICATE_DEVICE_WINDOW_MS = 300000; // 5 minutes
export const RISK_WEIGHTS = {
  rssi_consistency: 0.30,
  scan_timing: 0.20,
  attempt_count: 0.15,
  historical_flags: 0.25,
  cluster_score: 0.10,
};
export const ATTENDANCE_THRESHOLD_PERCENT = 75;
