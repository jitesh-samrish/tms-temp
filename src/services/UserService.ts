import { IUserRepository } from '../repositories/UserRepository';
import { Logger } from '../utils/Logger';

const logger = Logger.create('UserService');

export interface IUserService {
  getUserDetails(userId: string): Promise<any>;
  updateUserDetails(
    userId: string,
    updateData: { name?: string; picture_url?: string }
  ): Promise<any>;
  getUsersByIds(
    userIds: string[]
  ): Promise<Array<{ id: string; name: string }>>;
}

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}

  async getUserDetails(userId: string): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user._id,
      name: user.name,
      phoneNo: user.phone_no,
      pictureUrl: user.picture_url,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateUserDetails(
    userId: string,
    updateData: { name?: string; picture_url?: string }
  ): Promise<any> {
    if (!updateData.name && !updateData.picture_url) {
      throw new Error(
        'At least one field (name or picture_url) must be provided for update'
      );
    }

    const user = await this.userRepository.updateUser(userId, updateData);
    if (!user) {
      throw new Error('User not found or update failed');
    }

    logger.info(
      `User ${userId} details updated: ${JSON.stringify(updateData)}`
    );

    return {
      id: user._id,
      name: user.name,
      phoneNo: user.phone_no,
      pictureUrl: user.picture_url,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getUsersByIds(
    userIds: string[]
  ): Promise<Array<{ id: string; name: string }>> {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    const users = await this.userRepository.findByIds(userIds);

    return users.map((user) => ({
      id: user._id.toString(),
      name: user.name || '',
    }));
  }
}
