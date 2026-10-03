// Captures the volunteer's current device location at the moment they
// check in / check out, so an NGO admin can verify presence and interns
// can't inflate hours by checking in/out from somewhere they aren't.

export interface CapturedLocation {
  latitude: number;
  longitude: number;
  accuracy: number; // meters
  capturedAt: string; // ISO timestamp
}

export class LocationCaptureError extends Error {
  code: 'unsupported' | 'denied' | 'unavailable' | 'timeout';
  constructor(code: LocationCaptureError['code'], message: string) {
    super(message);
    this.code = code;
  }
}

export function captureLocation(): Promise<CapturedLocation> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new LocationCaptureError('unsupported', 'Location services are not supported on this device/browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: new Date().toISOString(),
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new LocationCaptureError('denied', 'Location permission was denied. Please allow location access to check in/out — it is required to verify attendance.'));
        } else if (err.code === err.TIMEOUT) {
          reject(new LocationCaptureError('timeout', 'Timed out getting your location. Please try again with location services enabled.'));
        } else {
          reject(new LocationCaptureError('unavailable', 'Could not determine your location. Please enable GPS/location services and try again.'));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export function formatCoords(loc: { latitude: number; longitude: number }): string {
  return `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`;
}

export function mapsLink(loc: { latitude: number; longitude: number }): string {
  return `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
}
