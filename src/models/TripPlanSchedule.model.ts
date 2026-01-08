import mongoose from 'mongoose';
import {
  ITripPlanSchedule,
  TripPlanScheduleSchema,
} from 'tms-common-db/schemas/tripPlanSchedule.schema';

export { ITripPlanSchedule } from 'tms-common-db/schemas/tripPlanSchedule.schema';
export const TripPlanScheduleModel = mongoose.model<ITripPlanSchedule>(
  'TripPlanSchedule',
  TripPlanScheduleSchema
);
