import { IUserRepository } from '../repositories/UserRepository';
import { IOTPRepository } from '../repositories/OTPRepository';
import { ISessionRepository } from '../repositories/SessionRepository';
import { IFCMTokenRepository } from '../repositories/FCMTokenRepository';
import * as jwt from 'jsonwebtoken';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '../utils/errors';
import { ServerConfig } from '../config/ServerConfig';
import { CommonUtils } from '../utils/CommonUtils';
import { Logger } from '../utils/Logger';
import { RedisClient } from '../config/RedisClient';
import { IUser } from 'qms-common-db/schemas/user.schema';
import { ISMSService } from './SMSService';

const logger = Logger.create('AuthService');

export interface SignupRequest {
  name: string;
  phoneNo: string;
}

export interface SendOTPRequest {
  phoneNo: string;
}

export interface VerifyOTPRequest {
  phoneNo: string;
  otp: string;
  deviceInfo?: Record<string, any>;
  appVersion?: string;
  appName?: string;
  fcmToken?: string;
}

export interface OTPResponse {
  success: boolean;
  otp?: string;
  message: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    phoneNo: string;
    email?: string;
  };
}

export interface IAuthService {
  signup(request: SignupRequest): Promise<AuthResponse>;
  sendOTP(request: SendOTPRequest): Promise<OTPResponse>;
  verifyOTP(request: VerifyOTPRequest): Promise<AuthResponse>;
  verifyToken(token: string): Promise<any>;
  logout(sessionId: string): Promise<void>;
}

export class AuthService implements IAuthService {
  constructor(
    private userRepository: IUserRepository,
    private otpRepository: IOTPRepository,
    private sessionRepository: ISessionRepository,
    private fcmTokenRepository: IFCMTokenRepository,
    private smsService: ISMSService
  ) {}

  private testPhoneNumbers = ['0000000000'];

  // Generate JWT token with sessionId
  private generateToken(user: IUser, sessionId: string): string {
    const payload = {
      id: user._id.toString(),
      name: user.name,
      phoneNo: user.phone_no,
      sessionId: sessionId,
    };
    return jwt.sign(payload, ServerConfig.JWT_SECRET, {
      expiresIn: ServerConfig.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  // Verify JWT token
  async verifyToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, ServerConfig.JWT_SECRET);
    } catch (_) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async signup(request: SignupRequest): Promise<AuthResponse> {
    // Validate input
    if (!request.phoneNo) {
      throw new BadRequestException('Phone number is required');
    }

    // Phone number validation (basic)
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(request.phoneNo)) {
      throw new BadRequestException('Invalid phone number format');
    }

    // Check if phone number already exists
    const phoneExists = await this.userRepository.phoneNoExists(
      request.phoneNo
    );
    if (phoneExists) {
      throw new ConflictException('Phone number already registered');
    }

    // Create user
    const newUser = await this.userRepository.createUser(
      request.phoneNo,
      request.name || 'Unnamed User',
      false
    );

    return {
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        phoneNo: newUser.phone_no,
      },
    };
  }

  async sendOTP(request: SendOTPRequest): Promise<OTPResponse> {
    // Validate input
    if (!request.phoneNo) {
      throw new BadRequestException('Phone number is required');
    }

    // Phone number validation
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(request.phoneNo)) {
      throw new BadRequestException('Invalid phone number format');
    }

    const user = await this.userRepository.findByPhoneNo(request.phoneNo);
    if (!user) {
      await this.userRepository.createUser(
        request.phoneNo,
        'Unnamed User',
        false
      );
    }

    // Check OTP rate limit: max 6 OTPs in 15 minutes
    const recentOTPCount = await this.otpRepository.countRecentOTPs(
      request.phoneNo,
      15
    );
    if (recentOTPCount >= 6) {
      throw new BadRequestException(
        'OTP limit exceeded. You can only request 6 OTPs within 15 minutes. Please try again later'
      );
    }

    // Generate OTP
    const otp = CommonUtils.generateOTP();
    const expiresAt = CommonUtils.getExpirationTime(15); // 15 minutes

    // Save OTP to database
    await this.otpRepository.saveOTP(request.phoneNo, otp, expiresAt);

    // Send OTP via SMS service (e.g., Twilio, AWS SNS)
    logger.info(`OTP sent for phone: ${request.phoneNo}`);
    logger.debug(`OTP for ${request.phoneNo}: ${otp}`);
    await this.smsService.sendOTP(request.phoneNo, otp);

    return ServerConfig.NODE_ENV != 'production'
      ? {
          success: true,
          otp,
          message: 'OTP sent successfully',
        }
      : {
          success: true,
          message: 'OTP sent successfully',
        };
  }

  async verifyOTP(request: VerifyOTPRequest): Promise<AuthResponse> {
    // Validate input
    if (!request.phoneNo || !request.otp) {
      throw new BadRequestException('Phone number and OTP are required');
    }

    // Special handling for test phone numbers - bypass OTP verification
    const isTestPhoneNumber = this.testPhoneNumbers.includes(request.phoneNo);

    if (isTestPhoneNumber) {
      // For test phone numbers, only accept OTP "8888"
      if (request.otp !== '8888') {
        throw new UnauthorizedException('Invalid OTP');
      }
    } else {
      // Regular OTP verification for non-test phone numbers
      // Find the latest OTP for this phone number
      const latestOTP = await this.otpRepository.findLatestOTP(request.phoneNo);

      if (!latestOTP) {
        throw new NotFoundException('No OTP found for this phone number');
      }

      // Check if OTP is already used
      if (latestOTP.is_used) {
        throw new BadRequestException('OTP has already been used');
      }

      // Check if OTP has expired
      if (CommonUtils.isExpired(latestOTP.expires_at)) {
        throw new BadRequestException('OTP has expired');
      }

      // Verify OTP matches
      if (latestOTP.otp !== request.otp) {
        throw new UnauthorizedException('Invalid OTP');
      }

      // Mark OTP as used
      await this.otpRepository.markOTPAsUsed(latestOTP._id.toString());
    }

    // Find or create user
    let user = await this.userRepository.findByPhoneNo(request.phoneNo);

    if (!user) {
      // Auto-create user if doesn't exist
      user = await this.userRepository.createUser(
        request.phoneNo,
        'Unnamed User',
        true
      );
    } else {
      // Mark user as verified if not already
      if (!user.verified) {
        await this.userRepository.markUserAsVerified(user._id.toString());
      }
    }

    // Create a new session for this login
    const session = await this.sessionRepository.createSession(
      user._id.toString(),
      request.deviceInfo,
      request.appVersion,
      request.appName,
      CommonUtils.getExpirationTime(24 * 60) // 1 day
    );

    // Save FCM token if provided
    if (request.fcmToken) {
      try {
        await this.fcmTokenRepository.saveFCMToken(
          user._id.toString(),
          request.fcmToken,
          session._id.toString()
        );
        logger.info(
          `FCM token saved for user ${user._id} with session ${session._id}`
        );
      } catch (error) {
        logger.warn(`Failed to save FCM token: ${error}`);
      }
    }

    // Store session in Redis with key: session:<session_id>
    try {
      const redis = RedisClient.getInstance();
      const sessionKey = `session:${session._id.toString()}`;
      const sessionData = {
        userId: session.user_id.toString(),
        status: session.status,
        deviceInfo: session.device_info,
        appVersion: session.app_version,
        appName: session.app_name,
        createdAt: session.createdAt.toISOString(),
      };
      await redis.set(
        sessionKey,
        JSON.stringify(sessionData),
        'EX',
        1 * 24 * 60 * 60
      ); // 1 day TTL
      logger.debug(`Session ${session._id} stored in Redis`);
    } catch (error) {
      logger.warn(`Failed to store session in Redis: ${error}`);
    }

    // Generate JWT token with sessionId
    const token = this.generateToken(user, session._id.toString());

    return {
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        phoneNo: user.phone_no,
      },
    };
  }

  async logout(sessionId: string): Promise<void> {
    // Invalidate the session
    await this.sessionRepository.invalidateSession(sessionId);
    logger.info(`User logged out, session ${sessionId} invalidated`);

    // Delete session from Redis
    try {
      const redis = RedisClient.getInstance();
      const sessionKey = `session:${sessionId}`;
      await redis.del(sessionKey);
      logger.debug(`Session ${sessionId} deleted from Redis`);
    } catch (error) {
      logger.warn(`Failed to delete session from Redis: ${error}`);
    }
  }
}
