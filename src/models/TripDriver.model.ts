import mongoose from 'mongoose';
import {
  TripDriverSchema,
  ITripDriver,
} from 'tms-common-db/schemas/tripDriver.schema';

const TripDriverModel = mongoose.model<ITripDriver>(
  'TripDriver',
  TripDriverSchema
);

export default TripDriverModel;
