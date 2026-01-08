import mongoose from 'mongoose';
import { ITrip, TripSchema } from 'tms-common-db/schemas/trip.schema';

export { ITrip, IAcl } from 'tms-common-db/schemas/trip.schema';
export const TripModel = mongoose.model<ITrip>('Trip', TripSchema);
