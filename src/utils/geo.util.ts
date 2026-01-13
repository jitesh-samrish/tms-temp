import { distance as turfDistance, point } from '@turf/turf';

/**
 * Coordinate interface
 */
export interface Coord {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two coordinates using Turf.js
 * @param from - Starting coordinate
 * @param to - Ending coordinate
 * @returns Distance in meters
 */
export function calculateDistance(from: Coord, to: Coord): number {
  const fromPoint = point([from.longitude, from.latitude]);
  const toPoint = point([to.longitude, to.latitude]);

  // Distance is returned in kilometers by default, convert to meters
  const distanceKm = turfDistance(fromPoint, toPoint, { units: 'kilometers' });
  return distanceKm * 1000; // Convert to meters
}

/**
 * Calculate speed based on distance and time difference
 * @param distanceMeters - Distance traveled in meters
 * @param timeDiffSeconds - Time difference in seconds
 * @returns Speed in meters per second
 */
export function calculateSpeed(
  distanceMeters: number,
  timeDiffSeconds: number
): number {
  if (timeDiffSeconds === 0) {
    return 0;
  }
  return distanceMeters / timeDiffSeconds;
}

/**
 * Calculate speed in km/h
 * @param distanceMeters - Distance traveled in meters
 * @param timeDiffSeconds - Time difference in seconds
 * @returns Speed in kilometers per hour
 */
export function calculateSpeedKmh(
  distanceMeters: number,
  timeDiffSeconds: number
): number {
  const speedMps = calculateSpeed(distanceMeters, timeDiffSeconds);
  return speedMps * 3.6; // Convert m/s to km/h
}
