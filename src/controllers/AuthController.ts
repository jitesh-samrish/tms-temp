import { NextFunction, Request, Response } from 'express';
import {
  SignupRequest,
  SendOTPRequest,
  VerifyOTPRequest,
  IAuthService,
} from '../services/AuthService';
import { StatusCodes } from 'http-status-codes';
import { ResponseUtils } from '../utils/ResponseUtils';
import { BadRequestException } from '../utils/errors';

export class AuthController {
  constructor(private authService: IAuthService) {}

  // Handles POST /api/v1/auth/signup
  public handleSignup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { name, phoneNo } = req.body;

      const signupRequest: SignupRequest = {
        name,
        phoneNo,
      };

      const result = await this.authService.signup(signupRequest);
      ResponseUtils.successResponse(
        res,
        result.message,
        { user: result.user },
        StatusCodes.CREATED
      );
    } catch (error: any) {
      next(error);
    }
  };

  // Handles POST /api/v1/auth/send-otp
  public handleSendOTP = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { phoneNo } = req.body;

      const sendOTPRequest: SendOTPRequest = {
        phoneNo,
      };

      const result = await this.authService.sendOTP(sendOTPRequest);
      ResponseUtils.successResponse(
        res,
        result.message,
        result,
        StatusCodes.OK
      );
    } catch (error: any) {
      next(error);
    }
  };

  // Handles POST /api/v1/auth/verify-otp
  public handleVerifyOTP = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { phoneNo, otp, deviceInfo, appVersion, appName, fcmToken } =
        req.body;

      const verifyOTPRequest: VerifyOTPRequest = {
        phoneNo,
        otp,
        deviceInfo,
        appVersion,
        appName,
        fcmToken,
      };

      const result = await this.authService.verifyOTP(verifyOTPRequest);
      ResponseUtils.successResponse(
        res,
        result.message,
        { token: result.token, user: result.user },
        StatusCodes.OK
      );
    } catch (error: any) {
      next(error);
    }
  };

  // Handles POST /api/v1/auth/logout
  public handleLogout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const sessionId = req.user?.sessionId;

      if (!sessionId) {
        throw new BadRequestException('Session ID not found in token');
      }

      await this.authService.logout(sessionId);
      ResponseUtils.successResponse(
        res,
        'Logged out successfully',
        null,
        StatusCodes.OK
      );
    } catch (error: any) {
      next(error);
    }
  };
}
