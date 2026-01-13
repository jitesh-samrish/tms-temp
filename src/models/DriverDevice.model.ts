import mongoose from 'mongoose';
import {
  DriverDeviceSchema,
  IDriverDevice,
} from 'tms-common-db/schemas/driverDeviceSchema';

const DriverDeviceModel = mongoose.model<IDriverDevice>(
  'DriverDevice',
  DriverDeviceSchema
);

export default DriverDeviceModel;
