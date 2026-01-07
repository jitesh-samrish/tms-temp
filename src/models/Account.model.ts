import mongoose from 'mongoose';
import { IAccount, AccountSchema } from 'qms-common-db/schemas/account.schema';

export { IAccount };
export const AccountModel = mongoose.model<IAccount>('Account', AccountSchema);
