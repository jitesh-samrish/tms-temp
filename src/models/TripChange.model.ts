import mongoose from 'mongoose';
import {
  TripChangeSchema,
  ITripChange,
} from 'tms-common-db/schemas/tripChange.schema';

export { ITripChange as IChange };
export const ChangeModel = mongoose.model<ITripChange>(
  'Change',
  TripChangeSchema
);
