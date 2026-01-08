import mongoose from 'mongoose';
import {
  ITripPlan,
  TripPlanSchema,
} from 'tms-common-db/schemas/tripPlan.schema';

export { ITripPlan, IDateRange } from 'tms-common-db/schemas/tripPlan.schema';
export const TripPlanModel = mongoose.model<ITripPlan>(
  'TripPlan',
  TripPlanSchema
);
