import mongoose from 'mongoose';
import { IDevice, DeviceSchema } from 'tms-common-db/schemas/device.schema';

export { IDevice };
export const DeviceModel = mongoose.model<IDevice>('Device', DeviceSchema);
