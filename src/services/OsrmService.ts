import axios, { AxiosError } from 'axios';
import { ServerConfig } from '../config/ServerConfig';
import { Logger } from '../utils/Logger';

const logger = Logger.create('OsrmService');

/**
 * Input point structure for map matching
 */
export interface MapMatchPoint {
  lat: number;
  lng: number;
  timestamp: Date;
  accuracy?: number;
}

/**
 * Output matched point with confidence
 */
export interface MatchedPoint {
  lat: number;
  lng: number;
  confidence: number;
}

/**
 * OSRM Match API Response Interfaces
 */
interface OsrmWaypoint {
  hint?: string;
  distance?: number;
  name?: string;
  location: [number, number]; // [lng, lat]
}

interface OsrmTracepoint {
  alternatives_count: number;
  waypoint_index: number;
  matchings_index: number;
  location: [number, number]; // [lng, lat]
  name: string;
  hint?: string;
  distance?: number;
}

interface OsrmManeuver {
  bearing_after: number;
  bearing_before: number;
  location: [number, number];
  type: string;
  modifier?: string;
}

interface OsrmStep {
  distance: number;
  duration: number;
  geometry: string;
  weight: number;
  name: string;
  mode: string;
  maneuver: OsrmManeuver;
  intersections?: any[];
  driving_side?: string;
}

interface OsrmLeg {
  steps: OsrmStep[];
  distance: number;
  duration: number;
  weight: number;
  summary?: string;
}

interface OsrmMatching {
  confidence: number;
  distance: number;
  duration: number;
  weight: number;
  weight_name: string;
  legs: OsrmLeg[];
  geometry: string;
}

interface OsrmMatchResponse {
  code: string;
  matchings?: OsrmMatching[];
  tracepoints?: (OsrmTracepoint | null)[];
  message?: string;
}

/**
 * Service for interacting with OSRM (Open Source Routing Machine)
 * Handles map matching (snapping GPS points to roads)
 */
export class OsrmService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = ServerConfig.OSRM_BASE_URL;
  }

  /**
   * Match a path of GPS points to the road network using OSRM's map matching
   *
   * @param points - Array of GPS points with timestamps and optional accuracy
   * @returns Array of matched points with confidence scores
   */
  async matchPath(points: MapMatchPoint[]): Promise<MatchedPoint[]> {
    // If fewer than 3 points, return as-is (matching requires context)
    if (points.length < 3) {
      logger.warn(
        'Map matching requires at least 3 points, returning original points'
      );
      return points.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        confidence: 0,
      }));
    }

    try {
      // Build coordinates string (lng,lat format - longitude first!)
      const coordinates = points.map((p) => `${p.lng},${p.lat}`).join(';');

      // Build timestamps (UNIX timestamps in seconds)
      const timestamps = points
        .map((p) => Math.floor(p.timestamp.getTime() / 1000))
        .join(';');

      // Build radiuses with special handling for first/last points
      const radiuses = points
        .map((p, index) => {
          // Use 25m for first and last points to be more forgiving
          if (index === 0 || index === points.length - 1) {
            return 25;
          }
          // Use point's accuracy if available, otherwise default to 15m
          return p.accuracy ?? 15;
        })
        .join(';');

      // Construct the full URL
      const url = `${this.baseUrl}/match/v1/driving/${coordinates}`;
      const params = {
        overview: 'full',
        steps: 'true',
        gaps: 'ignore',
        tidy: 'true',
        timestamps,
        radiuses,
      };

      logger.debug(`Calling OSRM match with ${points.length} points`);

      const response = await axios.get<OsrmMatchResponse>(url, { params });

      // Check for NoMatch or NoSegment errors
      if (
        response.data.code === 'NoMatch' ||
        response.data.code === 'NoSegment'
      ) {
        logger.warn(
          `OSRM returned ${response.data.code}, falling back to raw points`
        );
        return points.map((p) => ({
          lat: p.lat,
          lng: p.lng,
          confidence: 0,
        }));
      }

      // Check if response is valid
      if (response.data.code !== 'Ok' || !response.data.tracepoints) {
        logger.warn(
          `OSRM returned unexpected code: ${response.data.code}, message: ${response.data.message}`
        );
        return points.map((p) => ({
          lat: p.lat,
          lng: p.lng,
          confidence: 0,
        }));
      }

      // Extract matched points from tracepoints
      const matchedPoints: MatchedPoint[] = [];
      const tracepoints = response.data.tracepoints;
      const matchings = response.data.matchings || [];

      // Get overall confidence from the first matching (if available)
      const overallConfidence =
        matchings.length > 0 ? matchings[0].confidence : 0;

      for (let i = 0; i < tracepoints.length; i++) {
        const tracepoint = tracepoints[i];

        if (tracepoint === null) {
          // OSRM couldn't match this point, use original
          logger.debug(`Point ${i} could not be matched, using original`);
          matchedPoints.push({
            lat: points[i].lat,
            lng: points[i].lng,
            confidence: 0,
          });
        } else {
          // Use matched point from OSRM
          matchedPoints.push({
            lat: tracepoint.location[1], // lat is second in OSRM response
            lng: tracepoint.location[0], // lng is first in OSRM response
            confidence: overallConfidence,
          });
        }
      }

      logger.debug(
        `Successfully matched ${
          matchedPoints.length
        } points with confidence ${overallConfidence.toFixed(2)}`
      );
      return matchedPoints;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        logger.error(`OSRM API error: ${axiosError.message}`, {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
        });
      } else {
        logger.error(`Unexpected error during map matching: ${error}`);
      }

      // Fallback to original points on any error
      logger.warn('Falling back to original raw points due to error');
      return points.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        confidence: 0,
      }));
    }
  }

  /**
   * Health check for OSRM service
   * @returns true if OSRM is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check using a minimal match request
      const testUrl = `${this.baseUrl}/match/v1/driving/13.388860,52.517037;13.397634,52.529407`;
      const response = await axios.get(testUrl, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      logger.error('OSRM health check failed', error);
      return false;
    }
  }
}

// Export singleton instance
export const osrmService = new OsrmService();
