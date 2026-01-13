import mongoose from 'mongoose';
import {
  DeviceMatrixSchema,
  IDeviceMatrix,
} from 'tms-common-db/schemas/deviceMatrix.schema';

/**
 * DeviceMatrix Model
 * Raw GPS data from devices stored in a time-series collection
 */
export const DeviceMatrix = mongoose.model<IDeviceMatrix>(
  'DeviceMatrix',
  DeviceMatrixSchema
);

export type { IDeviceMatrix };
