import { Logger } from './Logger';

const logger = Logger.create('Fast2SMSUtil');

export interface Fast2SMSConfig {
  apiKey: string;
  senderId?: string;
  route?: 'q' | 'dlt' | 'otp' | 'v3';
}

export interface SMSResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

export class Fast2SMSUtil {
  private static config: Fast2SMSConfig = {
    apiKey: process.env.FAST2SMS_API_KEY || '',
    senderId: process.env.FAST2SMS_SENDER_ID || 'TXTIND',
    route: (process.env.FAST2SMS_ROUTE as 'q' | 'dlt' | 'otp' | 'v3') || 'q',
  };

  /**
   * Sends SMS using Fast2SMS API
   * @param phoneNumbers - Array of phone numbers or single phone number
   * @param message - The message to send
   * @param route - Optional route override (q, dlt, otp, v3)
   * @returns Promise with SMS response
   */
  static async sendSMS(
    phoneNumbers: string | string[],
    message: string,
    route?: 'q' | 'dlt' | 'otp' | 'v3'
  ): Promise<SMSResponse> {
    try {
      if (!this.config.apiKey) {
        logger.error('Fast2SMS API key not configured');
        throw new Error(
          'SMS service not configured. Please set FAST2SMS_API_KEY in environment variables.'
        );
      }

      // Convert single phone number to array
      const numbers = Array.isArray(phoneNumbers)
        ? phoneNumbers
        : [phoneNumbers];

      // Remove any +91 prefix and validate
      const sanitizedNumbers = numbers.map((num) => {
        const cleaned = num.replace(/^\+91/, '').replace(/\s/g, '');
        if (!/^\d{10}$/.test(cleaned)) {
          throw new Error(`Invalid phone number format: ${num}`);
        }
        return cleaned;
      });

      const payload = {
        route: route || this.config.route,
        sender_id: this.config.senderId,
        message: message,
        language: 'english',
        flash: 0,
        numbers: sanitizedNumbers.join(','),
      };

      logger.info(`Sending SMS to ${sanitizedNumbers.length} number(s)`);

      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.return === true || response.ok) {
        logger.info(
          `SMS sent successfully. Message ID: ${data.message_id || 'N/A'}`
        );
        return {
          success: true,
          message: 'SMS sent successfully',
          messageId: data.message_id,
        };
      } else {
        logger.error(`Failed to send SMS: ${data.message || 'Unknown error'}`);
        return {
          success: false,
          message: data.message || 'Failed to send SMS',
        };
      }
    } catch (error: any) {
      logger.error(`Error sending SMS: ${error.message}`, error);
      return {
        success: false,
        message: error.message || 'Failed to send SMS',
      };
    }
  }

  /**
   * Sends OTP SMS using Fast2SMS
   * @param phoneNumber - Phone number to send OTP to
   * @param otp - The OTP code
   * @returns Promise with SMS response
   */
  static async sendOTP(phoneNumber: string, otp: string): Promise<SMSResponse> {
    const message = `Your OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`;
    return this.sendSMS(phoneNumber, message, 'otp');
  }

  /**
   * Sends token invite SMS to unverified users
   * @param phoneNumber - Phone number to send invite to
   * @param tokenNumber - The token number
   * @param queueName - Name of the queue
   * @param appDownloadLink - Link to download the app
   * @returns Promise with SMS response
   */
  static async sendTokenInvite(
    phoneNumber: string,
    tokenNumber: string,
    queueName: string,
    appDownloadLink: string
  ): Promise<SMSResponse> {
    const message = `You have been assigned token ${tokenNumber} for ${queueName}. Download our app for real-time updates: ${appDownloadLink}`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Update Fast2SMS configuration
   * @param config - Partial configuration to update
   */
  static updateConfig(config: Partial<Fast2SMSConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Fast2SMS configuration updated');
  }
}
