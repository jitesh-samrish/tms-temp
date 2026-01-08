import mongoose from 'mongoose';
import { ChangeSchema, IChange } from 'tms-common-db/schemas/change.schema';

export { IChange };
export const ChangeModel = mongoose.model<IChange>('Change', ChangeSchema);
