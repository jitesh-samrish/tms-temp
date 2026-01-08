import mongoose from 'mongoose';
import {
  IPassenger,
  PassengerSchema,
} from 'tms-common-db/schemas/passenger.schema';

export { IPassenger } from 'tms-common-db/schemas/passenger.schema';
export const PassengerModel = mongoose.model<IPassenger>(
  'Passenger',
  PassengerSchema
);
