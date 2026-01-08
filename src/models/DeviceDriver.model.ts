import mongoose from 'mongoose';
import {
  DeviceDriverSchema,
  IDeviceDriver,
} from 'tms-common-db/schemas/driverDeviceSchema';

const DeviceDriverModel = mongoose.model<IDeviceDriver>(
  'DeviceDriver',
  DeviceDriverSchema
);

export default DeviceDriverModel;
