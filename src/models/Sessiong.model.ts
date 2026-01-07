import mongoose from 'mongoose';
import { ISession, SessionSchema } from 'qms-common-db/schemas/session.schema';

export const SessionModel = mongoose.model<ISession>('Session', SessionSchema);
