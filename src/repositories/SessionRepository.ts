import { ISession } from 'qms-common-db/schemas/session.schema';
import { SessionModel } from '../models/Sessiong.model';
import { Logger } from '../utils/Logger';
import mongoose from 'mongoose';

const logger = Logger.create('SessionRepository');

export interface ISessionRepository {
  createSession(
    userId: string,
    deviceInfo?: Record<string, any>,
    appVersion?: string,
    appName?: string,
    expiresAt?: Date
  ): Promise<ISession>;
  getSessionById(sessionId: string): Promise<ISession | null>;
  getActiveSessionsByUserId(userId: string): Promise<ISession[]>;
  invalidateSession(sessionId: string): Promise<ISession | null>;
  invalidateAllUserSessions(userId: string): Promise<void>;
}

export class SessionRepository implements ISessionRepository {
  /**
   * Create a new session for a user
   */
  async createSession(
    userId: string,
    deviceInfo?: Record<string, any>,
    appVersion?: string,
    appName?: string,
    expiresAt?: Date
  ): Promise<ISession> {
    const session = new SessionModel({
      user_id: new mongoose.Types.ObjectId(userId),
      status: 'ACTIVE',
      device_info: deviceInfo,
      app_version: appVersion,
      app_name: appName,
      expired_at: expiresAt,
    });

    await session.save();
    logger.info(
      `Session created for user: ${userId}, sessionId: ${session._id}`
    );
    return session;
  }

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string): Promise<ISession | null> {
    return await SessionModel.findById(sessionId).exec();
  }

  /**
   * Get all active sessions for a user
   */
  async getActiveSessionsByUserId(userId: string): Promise<ISession[]> {
    return await SessionModel.find({
      user_id: new mongoose.Types.ObjectId(userId),
      status: 'ACTIVE',
    }).exec();
  }

  /**
   * Invalidate a specific session (set to INACTIVE)
   */
  async invalidateSession(sessionId: string): Promise<ISession | null> {
    // Get session to retrieve userId before invalidating
    const session = await SessionModel.findById(sessionId);

    await SessionModel.updateOne(
      { _id: sessionId },
      { $set: { status: 'INACTIVE', expired_at: new Date() } }
    );
    logger.info(`Session invalidated: ${sessionId}`);

    return session;
  }

  /**
   * Invalidate all sessions for a user (useful for logout all devices)
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    await SessionModel.updateMany(
      { user_id: new mongoose.Types.ObjectId(userId), status: 'ACTIVE' },
      { $set: { status: 'INACTIVE', expired_at: new Date() } }
    );
    logger.info(`All sessions invalidated for user: ${userId}`);
  }
}
