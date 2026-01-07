import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export interface ApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data?: any;
}

export class ResponseUtils {
  public static successResponse(
    res: Response,
    message: string,
    data: any = {},
    statusCode: number = StatusCodes.OK
  ): void {
    const response: ApiResponse = {
      statusCode,
      success: true,
      message,
      data,
    };
    res.status(statusCode).json(response);
  }

  public static errorResponse(
    res: Response,
    message: string,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    data: any = {}
  ): void {
    const response: ApiResponse = {
      statusCode,
      success: false,
      message,
      data,
    };
    res.status(statusCode).json(response);
  }
}
