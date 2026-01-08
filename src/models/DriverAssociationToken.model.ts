import mongoose from 'mongoose';
import {
  DriverAssociationTokenSchema,
  IDriverAssociationToken,
} from 'tms-common-db/schemas/driverAssociationToken.schema';

const DriverAssociationTokenModel = mongoose.model<IDriverAssociationToken>(
  'DriverAssociationToken',
  DriverAssociationTokenSchema
);

export default DriverAssociationTokenModel;
