import mongoose from 'mongoose';
import {
  VehicleDeviceSchema,
  IVehicleDevice,
} from 'tms-common-db/schemas/vehicleDeviceSchema';

export { IVehicleDevice };
export const VehicleDeviceModel = mongoose.model<IVehicleDevice>(
  'VehicleDevice',
  VehicleDeviceSchema
);
