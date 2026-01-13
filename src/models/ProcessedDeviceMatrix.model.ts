import mongoose from 'mongoose';
import {
  ProcessedDeviceMatrixSchema,
  IProcessedDeviceMatrix,
} from 'tms-common-db/schemas/processedDeviceMatrix.schema';

/**
 * ProcessedDeviceMatrix Model
 * Filtered and smoothed GPS data stored in a time-series collection
 */
export const ProcessedDeviceMatrix = mongoose.model<IProcessedDeviceMatrix>(
  'ProcessedDeviceMatrix',
  ProcessedDeviceMatrixSchema
);

export type { IProcessedDeviceMatrix };
