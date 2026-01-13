import mongoose from 'mongoose';
import {
  VehicleTripSchema,
  IVehicleTrip,
} from 'tms-common-db/schemas/vehicleTrip.schema';

export { IVehicleTrip };
export const VehicleTripModel = mongoose.model<IVehicleTrip>(
  'VehicleTrip',
  VehicleTripSchema
);
