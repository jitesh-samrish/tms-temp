import { Fast2SMSUtil, SMSResponse } from '../utils/Fast2SMSUtil';
import { Logger } from '../utils/Logger';
import { BadRequestException } from '../utils/errors';
import { ServerConfig } from '../config/ServerConfig';

const logger = Logger.create('SMSService');

export interface TokenInviteDetails {
  phoneNumber: string;
  tokenNumber: string;
  queueName: string;
  userName?: string;
}

export interface ISMSService {
  sendOTP(phoneNumber: string, otp: string): Promise<SMSResponse>;
  sendTokenInvite(tokenDetails: TokenInviteDetails): Promise<SMSResponse>;
  sendCustomSMS(phoneNumber: string, message: string): Promise<SMSResponse>;
  sendBulkSMS(phoneNumbers: string[], message: string): Promise<SMSResponse>;
}

export class SMSService implements ISMSService {
  private appDownloadLink: string;

  constructor() {
    this.appDownloadLink = ServerConfig.APP_DOWNLOAD_LINK;
  }

  /**
   * Sends OTP to user's phone number
   * @param phoneNumber - Phone number to send OTP to
   * @param otp - The OTP code
   * @returns Promise with SMS response
   */
  async sendOTP(phoneNumber: string, otp: string): Promise<SMSResponse> {
    try {
      if (!phoneNumber || !otp) {
        throw new BadRequestException('Phone number and OTP are required');
      }

      logger.info(`Sending OTP to ${phoneNumber}`);
      const result = await Fast2SMSUtil.sendOTP(phoneNumber, otp);

      if (!result.success) {
        logger.error(`Failed to send OTP to ${phoneNumber}: ${result.message}`);
      }

      return result;
    } catch (error: any) {
      logger.error(`Error sending OTP: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Sends token invite SMS to unverified users
   * @param tokenDetails - Details of the token and user
   * @returns Promise with SMS response
   */
  async sendTokenInvite(
    tokenDetails: TokenInviteDetails
  ): Promise<SMSResponse> {
    try {
      const { phoneNumber, tokenNumber, queueName } = tokenDetails;

      if (!phoneNumber || !tokenNumber || !queueName) {
        throw new BadRequestException(
          'Phone number, token number, and queue name are required'
        );
      }

      logger.info(`Sending token invite to unverified user ${phoneNumber}`);
      const result = await Fast2SMSUtil.sendTokenInvite(
        phoneNumber,
        tokenNumber,
        queueName,
        this.appDownloadLink
      );

      if (!result.success) {
        logger.error(
          `Failed to send token invite to ${phoneNumber}: ${result.message}`
        );
      }

      return result;
    } catch (error: any) {
      logger.error(`Error sending token invite: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Sends custom SMS to a phone number
   * @param phoneNumber - Phone number to send SMS to
   * @param message - The message content
   * @returns Promise with SMS response
   */
  async sendCustomSMS(
    phoneNumber: string,
    message: string
  ): Promise<SMSResponse> {
    try {
      if (!phoneNumber || !message) {
        throw new BadRequestException('Phone number and message are required');
      }

      logger.info(`Sending custom SMS to ${phoneNumber}`);
      const result = await Fast2SMSUtil.sendSMS(phoneNumber, message);

      if (!result.success) {
        logger.error(`Failed to send SMS to ${phoneNumber}: ${result.message}`);
      }

      return result;
    } catch (error: any) {
      logger.error(`Error sending custom SMS: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Sends bulk SMS to multiple phone numbers
   * @param phoneNumbers - Array of phone numbers
   * @param message - The message content
   * @returns Promise with SMS response
   */
  async sendBulkSMS(
    phoneNumbers: string[],
    message: string
  ): Promise<SMSResponse> {
    try {
      if (!phoneNumbers || phoneNumbers.length === 0 || !message) {
        throw new BadRequestException('Phone numbers and message are required');
      }

      logger.info(`Sending bulk SMS to ${phoneNumbers.length} numbers`);
      const result = await Fast2SMSUtil.sendSMS(phoneNumbers, message);

      if (!result.success) {
        logger.error(`Failed to send bulk SMS: ${result.message}`);
      }

      return result;
    } catch (error: any) {
      logger.error(`Error sending bulk SMS: ${error.message}`, error);
      throw error;
    }
  }
}
