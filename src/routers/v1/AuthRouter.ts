import express from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../../controllers/AuthController';
import { AuthService } from '../../services/AuthService';
import { UserRepository } from '../../repositories/UserRepository';
import { AccountRepository } from '../../repositories/AccountRepository';
import { OTPRepository } from '../../repositories/OTPRepository';
import { SessionRepository } from '../../repositories/SessionRepository';
import { FCMTokenRepository } from '../../repositories/FCMTokenRepository';
import { AuthMiddleware } from '../../middlewares/AuthMiddleware';
import { SMSService } from '../../services/SMSService';
import { Logger } from '../../utils/Logger';

const authRouter = express.Router();
const logger = Logger.create('AuthRouter');

// Rate limiter for OTP requests: max 20 requests per minute (global limit, not per IP)
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit all requests to 20 per minute globally
  message: {
    success: false,
    message:
      'Too many OTP requests at the moment, please try again after a minute',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: () => {
    // Use a constant key to make this a global limit (not per IP)
    return 'global-otp-limit';
  },
  handler: (req, res) => {
    logger.warn(
      `OTP rate limit exceeded - Global limit of 20 requests per minute reached. IP: ${
        req.ip || req.socket.remoteAddress
      }`
    );
    res.status(429).json({
      success: false,
      message:
        'Too many OTP requests at the moment, please try again after a minute',
    });
  },
});

const accountRepository = new AccountRepository();
const userRepository = new UserRepository(accountRepository);
const otpRepository = new OTPRepository();
const sessionRepository = new SessionRepository();
const fcmTokenRepository = new FCMTokenRepository();
const smsService = new SMSService();
const authService = new AuthService(
  userRepository,
  otpRepository,
  sessionRepository,
  fcmTokenRepository,
  smsService
);
const authController = new AuthController(authService);

authRouter.post('/signup', authController.handleSignup);
authRouter.post('/send-otp', otpLimiter, authController.handleSendOTP);
authRouter.post('/verify-otp', authController.handleVerifyOTP);
authRouter.post(
  '/logout',
  AuthMiddleware.authenticate,
  authController.handleLogout
);

export default authRouter;
