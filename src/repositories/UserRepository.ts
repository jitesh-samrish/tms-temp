import { UserModel } from '../models/User.model';
import mongoose from 'mongoose';
import { Logger } from '../utils/Logger';
import { IUser } from 'qms-common-db/schemas/user.schema';
import { IAccountRepository } from './AccountRepository';

const logger = Logger.create('UserRepository');

export interface IUserRepository {
  findByName(name: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findByPhoneNo(phoneNo: string): Promise<IUser | null>;
  findById(id: string): Promise<IUser | null>;
  findByIds(ids: string[]): Promise<IUser[]>;
  createUser(
    phoneNo: string,
    name?: string,
    verified?: boolean
  ): Promise<IUser>;
  updateUser(
    userId: string,
    updateData: { name?: string; picture_url?: string }
  ): Promise<IUser | null>;
  emailExists(email: string): Promise<boolean>;
  phoneNoExists(phoneNo: string): Promise<boolean>;
  markUserAsVerified(userId: string): Promise<void>;
}

export class UserRepository implements IUserRepository {
  constructor(private accountRepository?: IAccountRepository) {}

  async findByName(name: string): Promise<IUser | null> {
    return await UserModel.findOne({ name }).exec();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    if (!email) return null;
    return await UserModel.findOne({ email }).exec();
  }

  async findByPhoneNo(phoneNo: string): Promise<IUser | null> {
    return await UserModel.findOne({ phone_no: phoneNo }).exec();
  }

  async findById(id: string): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await UserModel.findById(id).exec();
  }

  async findByIds(ids: string[]): Promise<IUser[]> {
    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) return [];
    return await UserModel.find({ _id: { $in: validIds } }).exec();
  }

  async createUser(
    phoneNo: string,
    name?: string,
    verified: boolean = false
  ): Promise<IUser> {
    const newUser = new UserModel({
      name,
      phone_no: phoneNo,
      verified,
    });

    await newUser.save();
    logger.info(`User created: ${name} (ID: ${newUser._id})`);

    // Create associated account
    if (this.accountRepository) {
      try {
        await this.accountRepository.createAccount(
          phoneNo,
          newUser._id.toString()
        );
        logger.info(`Account created for user ${newUser._id}`);
      } catch (error) {
        logger.error(
          `Failed to create account for user ${newUser._id}: ${error}`
        );
        // Don't fail user creation if account creation fails
      }
    }

    return newUser;
  }

  async emailExists(email: string): Promise<boolean> {
    if (!email) return false;
    const count = await UserModel.countDocuments({ email }).exec();
    return count > 0;
  }

  async updateUser(
    userId: string,
    updateData: { name?: string; picture_url?: string }
  ): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();

    if (user) {
      logger.info(`User ${userId} updated successfully`);
    }
    return user;
  }

  async phoneNoExists(phoneNo: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ phone_no: phoneNo }).exec();
    return count > 0;
  }

  async markUserAsVerified(userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return;

    await UserModel.updateOne(
      { _id: userId },
      { $set: { verified: true } }
    ).exec();

    logger.info(`User ${userId} marked as verified`);
  }
}
