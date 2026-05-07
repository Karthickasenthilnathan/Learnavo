/**
 * Device Fingerprint Generator
 * Creates a semi-unique device identifier for anti-proxy detection.
 */
import { Platform, Dimensions } from 'react-native';

export function getDeviceFingerprint() {
  const { width, height } = Dimensions.get('window');
  const raw = [
    Platform.OS,
    Platform.Version,
    width,
    height,
    Platform.constants?.Brand || 'unknown',
    Platform.constants?.Model || 'unknown',
  ].join('|');

  // Simple base64 hash for fingerprinting
  return btoa(raw).substring(0, 32);
}
