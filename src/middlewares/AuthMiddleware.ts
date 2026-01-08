import { Request, Response, NextFunction } from 'express';
import { UnauthorizedException } from '../utils/errors';
import * as jwt from 'jsonwebtoken';
import { ServerConfig } from '../config/ServerConfig';
import { Logger } from '../utils/Logger';
import { RedisUtils } from '../utils/RedisUtils';
import { RedisClient } from '../config/RedisClient';
import { SessionRepository } from '../repositories/SessionRepository';

const logger = Logger.create('AuthMiddleware');

// User Interface from JWT payload
interface JWTUser {
  id: string;
  name: string;
  phoneNo: string;
  sessionId: string;
  role?: string;
}

// Extend Express Request to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: JWTUser;
  }
}

export class AuthMiddleware {
  public static async authenticate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authHeader = req.headers['authorization'];

      if (!authHeader) {
        throw new UnauthorizedException('Missing Authorization header');
      }

      // Expect format: "Bearer <token>"
      const parts = authHeader.split(' ');

      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new UnauthorizedException(
          'Invalid Authorization header format. Expected: Bearer <token>'
        );
      }

      const token = parts[1];

      // Verify JWT token
      try {
        const decoded = jwt.verify(token, ServerConfig.JWT_SECRET) as JWTUser;

        const sessionId = decoded.sessionId;
        if (!sessionId) {
          throw new UnauthorizedException('Invalid token: missing session ID');
        }

        const sessionExists = await RedisUtils.checkSessionExists(sessionId);
        if (!sessionExists) {
          throw new UnauthorizedException('Session has expired or is invalid');
        }

        // Attach user to request
        req.user = decoded;
        logger.debug(
          `User authenticated: ${req.user.name} (${req.user.phoneNo})`
        );

        next();
      } catch (jwtError: any) {
        // Handle expired token specifically
        if (jwtError.name === 'TokenExpiredError') {
          // Decode the token without verification to get the session ID
          try {
            const decoded = jwt.decode(token) as JWTUser;

            if (decoded && decoded.sessionId) {
              const sessionId = decoded.sessionId;

              // Invalidate session in database
              try {
                const sessionRepository = new SessionRepository();
                await sessionRepository.invalidateSession(sessionId);
                logger.info(
                  `Session ${sessionId} invalidated due to expired token`
                );
              } catch (dbError) {
                logger.warn(`Failed to invalidate session in DB: ${dbError}`);
              }

              // Delete session from Redis
              try {
                const redis = RedisClient.getInstance();
                const sessionKey = `session:${sessionId}`;
                await redis.del(sessionKey);
                logger.debug(
                  `Session ${sessionId} deleted from Redis due to expired token`
                );
              } catch (redisError) {
                logger.warn(
                  `Failed to delete session from Redis: ${redisError}`
                );
              }
            }
          } catch (decodeError) {
            logger.warn(`Failed to decode expired token: ${decodeError}`);
          }
        }

        throw new UnauthorizedException('Invalid or expired token');
      }
    } catch (error) {
      next(error);
    }
  }
}
