import express from 'express';
import { MatrixController } from '../../controllers/MatrixController';
import { MatrixService } from '../../services/MatrixService';
import { MatrixRepository } from '../../repositories/MatrixRepository';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../utils/validators/Request.validator';
import {
  storeDeviceMatrixSchema,
  matrixIdParamSchema,
  matrixPaginationSchema,
} from '../../utils/validators/schemas/Matrix.zodSchema';

const matrixRouter = express.Router();

// Initialize repository, service, and controller
const matrixRepository = new MatrixRepository();
const matrixService = new MatrixService(matrixRepository);
const matrixController = new MatrixController(matrixService);

/**
 * @route   POST /api/v1/matrix
 * @desc    Store a new device matrix (GPS coordinates)
 * @access  Public (or use AuthMiddleware.authenticate if needed)
 * @body    { deviceId, coordinates: { latitude, longitude }, tripId?, metadata? }
 */
matrixRouter.post(
  '/',
  validateBody(storeDeviceMatrixSchema),
  matrixController.storeDeviceMatrix
);

/**
 * @route   GET /api/v1/matrix/raw
 * @desc    Get raw device matrices with pagination
 * @access  Public (or use AuthMiddleware.authenticate if needed)
 * @query   page, limit, deviceId, tripId, startDate, endDate
 */
matrixRouter.get(
  '/raw',
  validateQuery(matrixPaginationSchema),
  matrixController.getRawMatrices
);

/**
 * @route   GET /api/v1/matrix/processed
 * @desc    Get processed device matrices with pagination
 * @access  Public (or use AuthMiddleware.authenticate if needed)
 * @query   page, limit, deviceId, tripId, startDate, endDate
 */
matrixRouter.get(
  '/processed',
  validateQuery(matrixPaginationSchema),
  matrixController.getProcessedMatrices
);

/**
 * @route   GET /api/v1/matrix/raw/:matrixId
 * @desc    Get a specific raw device matrix by ID
 * @access  Public (or use AuthMiddleware.authenticate if needed)
 */
matrixRouter.get(
  '/raw/:matrixId',
  validateParams(matrixIdParamSchema),
  matrixController.getDeviceMatrixById
);

/**
 * @route   GET /api/v1/matrix/processed/:matrixId
 * @desc    Get a specific processed device matrix by ID
 * @access  Public (or use AuthMiddleware.authenticate if needed)
 */
matrixRouter.get(
  '/processed/:matrixId',
  validateParams(matrixIdParamSchema),
  matrixController.getProcessedDeviceMatrixById
);

export default matrixRouter;
