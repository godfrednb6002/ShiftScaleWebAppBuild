/**
 * Location detection (Phase 10).
 *
 * Two concepts are kept strictly separate:
 *   1. USER current location  - the farmer's live GPS position.
 *   2. FARM location            - the farm being analysed (may differ from user).
 *
 * Location is only retrieved when the farmer explicitly requests it
 * ("Locate Me" / "Use My Current Location"). There is no background tracking.
 * Region/district are reported only when a verified administrative boundary
 * dataset supports them; otherwise they are left null (never guessed).
 */

import type { LocationState } from '../types';
import { GHANA_BOUNDS } from '../types';

const DEFAULT_TIMEOUT_MS = 10000;

/** The approximate bounding box of Ghana, used for an in-country sanity check. */
export function isWithinGhanaBounds(lat: number, lng: number): boolean {
  return (
    lat >= GHANA_BOUNDS.south &&
    lat <= GHANA_BOUNDS.north &&
    lng >= GHANA_BOUNDS.west &&
    lng <= GHANA_BOUNDS.east
  );
}

/** Human-readable status for the in-country check. */
export function ghanaCheckMessage(lat: number, lng: number): string {
  return isWithinGhanaBounds(lat, lng)
    ? 'Within Ghana'
    : `Outside Ghana (${lat.toFixed(3)}°, ${lng.toFixed(3)}°). Analysis is optimized for Ghana.`;
}

/**
 * Request the farmer's current position once via the browser Geolocation API.
 * Uses a robust fast-resolution strategy:
 *   1. Tries high accuracy first.
 *   2. If high accuracy times out (common on desktop/laptop Wi-Fi), automatically
 *      falls back to standard accuracy to prevent hanging.
 */
export function getCurrentLocation({
  timeoutMs = DEFAULT_TIMEOUT_MS,
  highAccuracy = true,
}: { timeoutMs?: number; highAccuracy?: boolean } = {}): Promise<{
  lat: number;
  lng: number;
  accuracyMeters: number;
  timestamp: number;
}> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('unavailable'));
      return;
    }

    let settled = false;

    const handleSuccess = (pos: GeolocationPosition) => {
      if (settled) return;
      settled = true;
      resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracyMeters: pos.coords.accuracy,
        timestamp: pos.timestamp,
      });
    };

    const tryStandardAccuracy = () => {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        (err) => {
          if (settled) return;
          settled = true;
          if (err.code === 1) reject(new Error('denied'));
          else if (err.code === 2) reject(new Error('unavailable'));
          else if (err.code === 3) reject(new Error('timeout'));
          else reject(new Error('unknown'));
        },
        {
          enableHighAccuracy: false,
          timeout: 6000,
          maximumAge: 120000, // allow recent cached location for quick response
        }
      );
    };

    // Primary attempt
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (err) => {
        // If denied by user, reject immediately
        if (err.code === 1) {
          settled = true;
          reject(new Error('denied'));
          return;
        }
        // If timeout or unavailable with high accuracy, fallback to standard accuracy
        tryStandardAccuracy();
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: 4500, // don't hang too long on high accuracy
        maximumAge: 30000,
      }
    );

    // Global guard timer
    setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('timeout'));
      }
    }, timeoutMs);
  });
}

/** Empty / initial location state. */
export const initialLocationState: LocationState = {
  userLocation: null,
  farmLocation: null,
  region: null,
  district: null,
  source: 'none',
  status: 'idle',
  gpsAccuracyMeters: null,
  errorMessage: null,
};
