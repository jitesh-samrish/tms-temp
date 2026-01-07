import { IOTP } from 'qms-common-db/schemas/otp.schema';
import { OTPModel } from '../models/OTP.model';
import { Logger } from '../utils/Logger';

const logger = Logger.create('OTPRepository');

export interface IOTPRepository {
  saveOTP(phoneNo: string, otp: string, expiresAt: Date): Promise<IOTP>;
  findLatestOTP(phoneNo: string): Promise<IOTP | null>;
  countRecentOTPs(phoneNo: string, minutesAgo: number): Promise<number>;
  markOTPAsUsed(otpId: string): Promise<void>;
  deleteOTPsByPhoneNo(phoneNo: string): Promise<void>;
}

export class OTPRepository implements IOTPRepository {
  /**
   * Save a new OTP to the database
   */
  async saveOTP(phoneNo: string, otp: string, expiresAt: Date): Promise<IOTP> {
    const newOTP = new OTPModel({
      phone_no: phoneNo,
      otp,
      expires_at: expiresAt,
      is_used: false,
    });

    await newOTP.save();
    logger.debug(`OTP saved for phone: ${phoneNo}`);
    return newOTP;
  }

  /**
   * Find the latest (most recent) OTP for a phone number
   */
  async findLatestOTP(phoneNo: string): Promise<IOTP | null> {
    return await OTPModel.findOne({ phone_no: phoneNo })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Count OTPs created within the last N minutes for a phone number
   */
  async countRecentOTPs(phoneNo: string, minutesAgo: number): Promise<number> {
    const timeAgo = new Date(Date.now() - minutesAgo * 60 * 1000);
    return await OTPModel.countDocuments({
      phone_no: phoneNo,
      createdAt: { $gte: timeAgo },
    }).exec();
  }

  /**
   * Mark an OTP as used
   */
  async markOTPAsUsed(otpId: string): Promise<void> {
    await OTPModel.updateOne(
      { _id: otpId },
      { $set: { is_used: true } }
    ).exec();
    logger.debug(`OTP marked as used: ${otpId}`);
  }

  /**
   * Delete all OTPs for a phone number (useful for cleanup)
   */
  async deleteOTPsByPhoneNo(phoneNo: string): Promise<void> {
    await OTPModel.deleteMany({ phone_no: phoneNo }).exec();
    logger.debug(`All OTPs deleted for phone: ${phoneNo}`);
  }
}
