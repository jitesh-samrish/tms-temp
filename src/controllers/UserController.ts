import { NextFunction, Request, Response } from 'express';
import { IUserService } from '../services/UserService';
import { StatusCodes } from 'http-status-codes';
import { ResponseUtils } from '../utils/ResponseUtils';
import { BadRequestException } from '../utils/errors';

export class UserController {
  constructor(private userService: IUserService) {}

  public handleGetUserDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      const userDetails = await this.userService.getUserDetails(userId);

      ResponseUtils.successResponse(
        res,
        'User details fetched successfully',
        { user: userDetails },
        StatusCodes.OK
      );
    } catch (error: any) {
      next(error);
    }
  };

  public handleUpdateUserDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { name, picture_url } = req.body;

      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      if (!name && !picture_url) {
        throw new BadRequestException(
          'At least one field (name or picture_url) must be provided'
        );
      }

      if (name && name.length > 50) {
        throw new BadRequestException('Name cannot exceed 50 characters');
      }

      const updateData: { name?: string; picture_url?: string } = {};
      if (name) updateData.name = name;
      if (picture_url) updateData.picture_url = picture_url;

      const updatedUser = await this.userService.updateUserDetails(
        userId,
        updateData
      );

      ResponseUtils.successResponse(
        res,
        'User details updated successfully',
        { user: updatedUser },
        StatusCodes.OK
      );
    } catch (error: any) {
      next(error);
    }
  };

  public handleGetUsersByIds = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids)) {
        throw new BadRequestException('ids must be provided as an array');
      }

      if (ids.length === 0) {
        ResponseUtils.successResponse(
          res,
          'Users fetched successfully',
          { users: [] },
          StatusCodes.OK
        );
        return;
      }

      const users = await this.userService.getUsersByIds(ids);

      ResponseUtils.successResponse(
        res,
        'Users fetched successfully',
        { users },
        StatusCodes.OK
      );
    } catch (error: any) {
      next(error);
    }
  };
}
