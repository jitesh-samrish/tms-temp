import { AppError } from './AppError';
import { StatusCodes } from 'http-status-codes';

export class BadRequestException extends AppError {
  constructor(message: string = 'Bad Request') {
    super(message, StatusCodes.BAD_REQUEST);
  }
}

export class UnauthorizedException extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

export class ForbiddenException extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, StatusCodes.FORBIDDEN);
  }
}

export class NotFoundException extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, StatusCodes.NOT_FOUND);
  }
}

export class ConflictException extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, StatusCodes.CONFLICT);
  }
}

export class UnprocessableEntityException extends AppError {
  constructor(message: string = 'Unprocessable Entity') {
    super(message, StatusCodes.UNPROCESSABLE_ENTITY);
  }
}

export class InternalServerException extends AppError {
  constructor(message: string = 'Internal Server Error') {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR);
  }
}
