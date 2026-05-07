/**
 * BLE Simulator — provides fake RSSI readings for emulator testing
 */

/**
 * Simulate a BLE scan with realistic delays.
 * Returns { rssiMedian, readings, passed }
 */
export async function simulateBLEScan(scenario = 'normal') {
  // Simulate 2-second scan delay for realism
  await new Promise(resolve => setTimeout(resolve, 2000));

  const readings = [];
  const count = 10;

  switch (scenario) {
    case 'normal':
      // Student in classroom, ~3-5m from beacon
      for (let i = 0; i < count; i++) {
        readings.push(-55 + Math.floor(Math.random() * 15) - 7);
      }
      break;
    case 'edge':
      // Student at edge of range
      for (let i = 0; i < count; i++) {
        readings.push(-70 + Math.floor(Math.random() * 10) - 5);
      }
      break;
    case 'out_of_range':
      // Student outside classroom
      for (let i = 0; i < count; i++) {
        readings.push(-80 + Math.floor(Math.random() * 15) - 10);
      }
      break;
    default:
      return simulateBLEScan('normal');
  }

  const sorted = [...readings].sort((a, b) => a - b);
  const rssiMedian = sorted[Math.floor(sorted.length / 2)];
  const passed = rssiMedian >= -70;

  return { rssiMedian, readings, passed };
}
