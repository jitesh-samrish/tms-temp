import mongoose from 'mongoose';
import {
  IFailedStreamEvent,
  FailedStreamEventSchema,
} from 'tms-common-db/schemas/failedStreamEvent.schema';

export { IFailedStreamEvent };
export const FailedStreamEventModel = mongoose.model<IFailedStreamEvent>(
  'FailedStreamEvent',
  FailedStreamEventSchema
);
