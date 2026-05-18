import { v4 as uuidv4 } from 'uuid';

/**
 * Super basic browser fingerprint using screen size, 
 * timezone, language, and user agent to create a hash.
 */
export async function getBrowserFingerprint(): Promise<string> {
  const components = [
    window.navigator.userAgent,
    window.navigator.language,
    window.screen.colorDepth,
    window.screen.width + 'x' + window.screen.height,
    window.navigator.hardwareConcurrency,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  ];

  const fingerprintStr = components.join('|');
  const msgUint8 = new TextEncoder().encode(fingerprintStr);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem('arkd_device_id');
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem('arkd_device_id', deviceId);
  }
  return deviceId;
}
