import mongoose from 'mongoose';
import { DriverSchema, IDriver } from 'tms-common-db/schemas/driver.schema';

const DriverModel = mongoose.model<IDriver>('Driver', DriverSchema);

export default DriverModel;
