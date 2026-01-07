import mongoose from 'mongoose';
import { IUser, UserSchema } from 'qms-common-db/schemas/user.schema';

export { IUser };
export const UserModel = mongoose.model<IUser>('User', UserSchema);
