import { Coord } from '../utils/geo.util';

/**
 * Kalman Filter State
 */
interface KalmanState {
  latitude: number;
  longitude: number;
  errorCovariance: number;
}

/**
 * Kalman Filter Service for GPS coordinate smoothing
 * Uses a simple 1D Kalman filter for latitude and longitude independently
 */
export class KalmanService {
  private states: Map<string, KalmanState>;
  private processNoise: number;
  private measurementNoise: number;

  /**
   * @param processNoise - Process noise covariance (Q) - default 0.001
   * @param measurementNoise - Measurement noise covariance (R) - default 5.0
   */
  constructor(processNoise: number = 0.001, measurementNoise: number = 5.0) {
    this.states = new Map();
    this.processNoise = processNoise;
    this.measurementNoise = measurementNoise;
  }

  /**
   * Filter a GPS coordinate using Kalman filter
   * @param deviceId - Unique identifier for the device
   * @param noisyPoint - Raw GPS coordinate
   * @returns Filtered GPS coordinate
   */
  filter(deviceId: string, noisyPoint: Coord): Coord {
    let state = this.states.get(deviceId);

    // Initialize state if it doesn't exist
    if (!state) {
      state = {
        latitude: noisyPoint.latitude,
        longitude: noisyPoint.longitude,
        errorCovariance: 1.0,
      };
      this.states.set(deviceId, state);
      return noisyPoint; // Return the first point as-is
    }

    // Apply Kalman filter to latitude and longitude independently
    const filteredLat = this.applyKalmanFilter(
      state.latitude,
      noisyPoint.latitude,
      state.errorCovariance
    );
    const filteredLng = this.applyKalmanFilter(
      state.longitude,
      noisyPoint.longitude,
      state.errorCovariance
    );

    // Update state
    const updatedErrorCovariance = this.updateErrorCovariance(
      state.errorCovariance
    );

    this.states.set(deviceId, {
      latitude: filteredLat.estimate,
      longitude: filteredLng.estimate,
      errorCovariance: updatedErrorCovariance,
    });

    return {
      latitude: filteredLat.estimate,
      longitude: filteredLng.estimate,
    };
  }

  /**
   * Apply 1D Kalman filter
   */
  private applyKalmanFilter(
    previousEstimate: number,
    measurement: number,
    errorCovariance: number
  ): { estimate: number; errorCovariance: number } {
    // Prediction step
    const predictedEstimate = previousEstimate;
    const predictedErrorCovariance = errorCovariance + this.processNoise;

    // Update step
    const kalmanGain =
      predictedErrorCovariance /
      (predictedErrorCovariance + this.measurementNoise);
    const estimate =
      predictedEstimate + kalmanGain * (measurement - predictedEstimate);
    const updatedErrorCovariance = (1 - kalmanGain) * predictedErrorCovariance;

    return {
      estimate,
      errorCovariance: updatedErrorCovariance,
    };
  }

  /**
   * Update error covariance
   */
  private updateErrorCovariance(currentErrorCovariance: number): number {
    const predictedErrorCovariance = currentErrorCovariance + this.processNoise;
    const kalmanGain =
      predictedErrorCovariance /
      (predictedErrorCovariance + this.measurementNoise);
    return (1 - kalmanGain) * predictedErrorCovariance;
  }

  /**
   * Reset the filter state for a specific device
   */
  resetDevice(deviceId: string): void {
    this.states.delete(deviceId);
  }

  /**
   * Clear all filter states
   */
  clearAll(): void {
    this.states.clear();
  }
}

// Export singleton instance
export const kalmanService = new KalmanService();
