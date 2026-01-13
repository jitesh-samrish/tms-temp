import mongoose from 'mongoose';
import { IVehicle, VehicleSchema } from 'tms-common-db/schemas/vehicle.schema';

export { IVehicle };
export const VehicleModel = mongoose.model<IVehicle>('Vehicle', VehicleSchema);
