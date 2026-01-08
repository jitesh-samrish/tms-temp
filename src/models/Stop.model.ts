import mongoose from 'mongoose';
import { IStop, StopSchema } from 'tms-common-db/schemas/stop.schema';

export { IStop } from 'tms-common-db/schemas/stop.schema';
export const StopModel = mongoose.model<IStop>('Stop', StopSchema);
