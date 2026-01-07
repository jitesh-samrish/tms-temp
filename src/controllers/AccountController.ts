import { NextFunction, Request, Response } from 'express';
import { IAccountRepository } from '../repositories/AccountRepository';
import { StatusCodes } from 'http-status-codes';
import { ResponseUtils } from '../utils/ResponseUtils';
import { BadRequestException, NotFoundException } from '../utils/errors';

export class AccountController {
  constructor(private accountRepository: IAccountRepository) {}

  public handleDeleteAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      const deletedAccount = await this.accountRepository.deleteAccount(userId);

      if (!deletedAccount) {
        throw new NotFoundException('Account not found or already deleted');
      }

      ResponseUtils.successResponse(
        res,
        'Account deleted successfully',
        {
          account: {
            id: deletedAccount._id.toString(),
            phoneNo: deletedAccount.phone_no,
          },
        },
        StatusCodes.OK
      );
    } catch (error: any) {
      next(error);
    }
  };

  public handleGetAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      const account = await this.accountRepository.findByUserId(userId);

      if (!account) {
        throw new NotFoundException('Account not found');
      }

      ResponseUtils.successResponse(
        res,
        'Account fetched successfully',
        {
          account: {
            id: account._id.toString(),
            phoneNo: account.phone_no,
            userId: account.userId.toString(),
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
          },
        },
        StatusCodes.OK
      );
    } catch (error: any) {
      next(error);
    }
  };
}
