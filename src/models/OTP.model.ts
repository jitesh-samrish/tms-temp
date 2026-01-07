import mongoose from 'mongoose';
import { OTPSchema, IOTP } from 'qms-common-db/schemas/otp.schema';

export const OTPModel = mongoose.model<IOTP>('OTP', OTPSchema);
