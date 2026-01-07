import { FCMTokenModel } from '../models/FCMToken.model';
import mongoose from 'mongoose';
import { Logger } from '../utils/Logger';
import { IFCMToken } from 'qms-common-db/schemas/fcmToken.schema';

const logger = Logger.create('FCMTokenRepository');

export interface IFCMTokenRepository {
  saveFCMToken(
    userId: string,
    fcmToken: string,
    sessionId: string
  ): Promise<IFCMToken>;
  getFCMTokensByUserId(userId: string): Promise<IFCMToken[]>;
  deleteFCMToken(fcmToken: string): Promise<void>;
  deleteAllUserFCMTokens(userId: string): Promise<void>;
}

export class FCMTokenRepository implements IFCMTokenRepository {
  /**
   * Save or update FCM token for a user
   * Uses upsert to update if exists or create if new
   */
  async saveFCMToken(
    userId: string,
    fcmToken: string,
    sessionId: string
  ): Promise<IFCMToken> {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const sessionObjectId = new mongoose.Types.ObjectId(sessionId);

      // Upsert: update if exists (by fcm_token which is unique), create if not
      const fcmTokenDoc = await FCMTokenModel.findOneAndUpdate(
        { fcm_token: fcmToken },
        {
          user_id: userObjectId,
          fcm_token: fcmToken,
          session_id: sessionObjectId,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      logger.info(
        `FCM token saved for user ${userId} with session ${sessionId}`
      );
      return fcmTokenDoc;
    } catch (error) {
      logger.error(`Error saving FCM token: ${error}`);
      throw error;
    }
  }

  /**
   * Get all FCM tokens for a user
   */
  async getFCMTokensByUserId(userId: string): Promise<IFCMToken[]> {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const tokens = await FCMTokenModel.find({ user_id: userObjectId }).sort({
        createdAt: -1,
      });
      return tokens;
    } catch (error) {
      logger.error(`Error fetching FCM tokens for user ${userId}: ${error}`);
      throw error;
    }
  }

  /**
   * Delete a specific FCM token (token is unique)
   */
  async deleteFCMToken(fcmToken: string): Promise<void> {
    try {
      await FCMTokenModel.deleteOne({ fcm_token: fcmToken });
      logger.info(`FCM token deleted`);
    } catch (error) {
      logger.error(`Error deleting FCM token: ${error}`);
      throw error;
    }
  }

  /**
   * Delete all FCM tokens for a user
   */
  async deleteAllUserFCMTokens(userId: string): Promise<void> {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const result = await FCMTokenModel.deleteMany({ user_id: userObjectId });
      logger.info(
        `Deleted ${result.deletedCount} FCM tokens for user ${userId}`
      );
    } catch (error) {
      logger.error(
        `Error deleting all FCM tokens for user ${userId}: ${error}`
      );
      throw error;
    }
  }
}
