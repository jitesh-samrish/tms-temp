import mongoose from 'mongoose';
import {
  ITripSchedule,
  TripScheduleSchema,
} from 'tms-common-db/schemas/tripSchedule.schema';

export { ITripSchedule } from 'tms-common-db/schemas/tripSchedule.schema';
export const TripScheduleModel = mongoose.model<ITripSchedule>(
  'TripSchedule',
  TripScheduleSchema
);
