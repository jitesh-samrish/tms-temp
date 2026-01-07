import { AccountModel } from '../models/Account.model';
import mongoose from 'mongoose';
import { Logger } from '../utils/Logger';
import { IAccount } from 'qms-common-db/schemas/account.schema';

const logger = Logger.create('AccountRepository');

export interface IAccountRepository {
  createAccount(phoneNo: string, userId: string): Promise<IAccount>;
  deleteAccount(userId: string): Promise<IAccount | null>;
  findByUserId(userId: string): Promise<IAccount | null>;
  findByPhoneNo(phoneNo: string): Promise<IAccount | null>;
}

export class AccountRepository implements IAccountRepository {
  async createAccount(phoneNo: string, userId: string): Promise<IAccount> {
    const newAccount = new AccountModel({
      phone_no: phoneNo,
      userId,
    });

    await newAccount.save();
    logger.info(`Account created for user ${userId} with phone ${phoneNo}`);
    return newAccount;
  }

  async deleteAccount(userId: string): Promise<IAccount | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;

    const account = await AccountModel.findOneAndDelete({ userId }).exec();

    if (account) {
      logger.info(`Account deleted for user ${userId}`);
    }
    return account;
  }

  async findByUserId(userId: string): Promise<IAccount | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    return await AccountModel.findOne({ userId }).exec();
  }

  async findByPhoneNo(phoneNo: string): Promise<IAccount | null> {
    return await AccountModel.findOne({ phone_no: phoneNo }).exec();
  }
}
