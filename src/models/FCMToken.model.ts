import mongoose from 'mongoose';
import {
  FCMTokenSchema,
  IFCMToken,
} from 'qms-common-db/schemas/fcmToken.schema';

export { IFCMToken };
export const FCMTokenModel = mongoose.model<IFCMToken>(
  'FCMToken',
  FCMTokenSchema
);
