/**
 * BLE Service — Real BLE scanning using react-native-ble-manager v12
 *
 * v12 uses TurboModule EventEmitters for events, and a single ScanOptions
 * object for scan(). The old NativeEventEmitter + positional-args API is gone.
 */
import { Platform, PermissionsAndroid } from 'react-native';
import BleManager from 'react-native-ble-manager';
import { BEACON_UUID, RSSI_THRESHOLD, SCAN_DURATION_MS, MIN_READINGS } from '../config/beacon';

let isInitialized = false;

/**
 * Initialize BLE manager — call once before scanning.
 */
export async function initBLE() {
  if (isInitialized) return;
  try {
    await BleManager.start({ showAlert: false });
    isInitialized = true;
    console.log('[BLE] Manager initialized');
  } catch (err) {
    console.error('[BLE] Init failed:', err);
    throw new Error('Failed to initialize Bluetooth');
  }
}

/**
 * Request all required BLE/location permissions on Android.
 * Returns true if all granted, false otherwise.
 */
export async function requestBLEPermissions() {
  if (Platform.OS !== 'android') return true;

  try {
    const apiLevel = Platform.Version;

    if (apiLevel >= 31) {
      // Android 12+ requires BLUETOOTH_SCAN and BLUETOOTH_CONNECT
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      const allGranted = Object.values(results).every(
        r => r === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!allGranted) {
        console.warn('[BLE] Some permissions denied:', results);
        return false;
      }
    } else {
      // Android < 12 — just needs location
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission Required',
          message: 'LearnAvo needs location access to scan for classroom beacons.',
          buttonPositive: 'Allow',
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error('[BLE] Permission request error:', err);
    return false;
  }
}

/**
 * Perform a real BLE scan for the classroom beacon.
 *
 * Uses v12 APIs:
 *   - BleManager.scan({ serviceUUIDs, seconds, ... })
 *   - BleManager.onDiscoverPeripheral(callback)  (TurboModule EventEmitter)
 *
 * @param {number} classroomId - The classroom whose beacon to search for
 * @param {function} onProgress - Optional callback: ({ phase, rssiReadings, found })
 * @returns {Promise<{ rssiMedian, readings, passed, deviceName, deviceId }>}
 */
export function performBLEScan(classroomId, onProgress) {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Initialize
      await initBLE();

      // 2. Request permissions
      const permitted = await requestBLEPermissions();
      if (!permitted) {
        return reject(new Error('Bluetooth permissions not granted. Please allow all permissions.'));
      }

      const targetUUID = BEACON_UUID.toLowerCase();
      const rssiReadings = [];
      let beaconFound = false;
      let foundDevice = { name: null, id: null };

      onProgress?.({ phase: 'starting', rssiReadings: [], found: false });

      // Helper: process a discovered peripheral
      const processPeripheral = (peripheral) => {
        const serviceUUIDs = (peripheral.advertising?.serviceUUIDs || [])
          .map(u => u.toLowerCase());
        const nameMatch = (peripheral.name || peripheral.advertising?.localName || '')
          .toLowerCase();

        // Log ALL discovered devices for diagnostics
        console.log(
          `[BLE] Discovered: "${peripheral.name || 'unnamed'}" id=${peripheral.id} rssi=${peripheral.rssi} services=[${serviceUUIDs.join(',')}]`
        );

        // Match by service UUID OR by device name containing "learnavo" / "beacon"
        const isTargetBeacon =
          serviceUUIDs.includes(targetUUID) ||
          nameMatch.includes('learnavo') ||
          nameMatch.includes('beacon') ||
          nameMatch.includes('classroom') ||
          nameMatch.includes('nrf');

        if (isTargetBeacon && peripheral.rssi != null && peripheral.rssi !== 0) {
          beaconFound = true;
          foundDevice = {
            name: peripheral.name || peripheral.advertising?.localName || 'Beacon',
            id: peripheral.id,
          };
          rssiReadings.push(peripheral.rssi);

          console.log(
            `[BLE] ✅ BEACON MATCH: ${foundDevice.name} (${peripheral.id}) RSSI: ${peripheral.rssi} dBm`
          );

          onProgress?.({
            phase: 'scanning',
            rssiReadings: [...rssiReadings],
            found: true,
            deviceName: foundDevice.name,
          });
        }
      };

      // 3. Listen for discovered peripherals using v12 TurboModule EventEmitter
      let discoverSubscription = null;
      try {
        discoverSubscription = BleManager.onDiscoverPeripheral((peripheral) => {
          processPeripheral(peripheral);
        });
        console.log('[BLE] EventEmitter listener registered');
      } catch (listenerErr) {
        console.warn('[BLE] EventEmitter listener failed, will use polling only:', listenerErr.message);
      }

      // 4. Start scanning
      const scanSeconds = Math.ceil(SCAN_DURATION_MS / 1000);
      console.log(`[BLE] Starting scan for UUID: ${targetUUID} (duration: ${SCAN_DURATION_MS}ms)`);
      onProgress?.({ phase: 'scanning', rssiReadings: [], found: false });

      // 5. Set up polling FIRST (before scan call, in case scan hangs)
      const seenIds = new Set();
      const pollInterval = setInterval(async () => {
        try {
          const peripherals = await BleManager.getDiscoveredPeripherals();
          console.log(`[BLE] Poll: found ${peripherals.length} peripherals`);
          for (const p of peripherals) {
            if (!seenIds.has(p.id)) {
              seenIds.add(p.id);
              processPeripheral(p);
            }
          }
        } catch (e) {
          console.warn('[BLE] Poll error:', e.message);
        }
      }, 1500);

      // 6. Fire scan (don't await — the callback may never fire on some setups)
      BleManager.scan({
        serviceUUIDs: [],          // scan all, filter in listener
        seconds: scanSeconds,
        allowDuplicates: true,
        scanMode: 2,               // SCAN_MODE_LOW_LATENCY
      }).then(() => {
        console.log('[BLE] Scan started successfully');
      }).catch((err) => {
        console.warn('[BLE] Scan call error:', err);
      });

      // 6. Wait for scan duration then resolve
      setTimeout(async () => {
        clearInterval(pollInterval);

        try {
          await BleManager.stopScan();
        } catch (e) {
          // Scan may have already stopped
        }

        // One final poll to catch any remaining peripherals
        try {
          const finalPeripherals = await BleManager.getDiscoveredPeripherals();
          console.log(`[BLE] Final poll: ${finalPeripherals.length} peripherals`);
          for (const p of finalPeripherals) {
            if (!seenIds.has(p.id)) {
              seenIds.add(p.id);
              processPeripheral(p);
            }
          }
        } catch (e) {
          // ignore
        }

        // Remove listener
        discoverSubscription?.remove();

        console.log(`[BLE] Scan complete. Readings: ${rssiReadings.length}, Beacon found: ${beaconFound}`);

        if (!beaconFound || rssiReadings.length < MIN_READINGS) {
          onProgress?.({ phase: 'failed', rssiReadings, found: beaconFound });
          return reject(
            new Error(
              beaconFound
                ? `Only ${rssiReadings.length} readings collected (need at least ${MIN_READINGS})`
                : 'Classroom beacon not found. Make sure nRF Connect is advertising.'
            )
          );
        }

        // 7. Calculate median RSSI
        const sorted = [...rssiReadings].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const rssiMedian = sorted.length % 2 === 0
          ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
          : sorted[mid];

        const passed = rssiMedian >= RSSI_THRESHOLD;

        console.log(
          `[BLE] Result — Median: ${rssiMedian} dBm, Threshold: ${RSSI_THRESHOLD} dBm, Passed: ${passed}`
        );

        onProgress?.({
          phase: passed ? 'passed' : 'failed',
          rssiReadings,
          found: true,
          rssiMedian,
        });

        resolve({
          rssiMedian,
          readings: rssiReadings,
          passed,
          deviceName: foundDevice.name,
          deviceId: foundDevice.id,
        });
      }, SCAN_DURATION_MS + 500); // +500ms buffer

    } catch (err) {
      reject(err);
    }
  });
}

