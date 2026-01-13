import { z } from 'zod';

/**
 * Schema for storing device matrix
 */
export const storeDeviceMatrixSchema = z.object({
  deviceIdentifier: z.string().min(1, 'Device Identifier is required'),
  coordinates: z.object({
    latitude: z
      .number()
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90'),
    longitude: z
      .number()
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180'),
  }),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Schema for matrix ID parameter
 */
export const matrixIdParamSchema = z.object({
  matrixId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid matrix ID format'),
});

/**
 * Schema for pagination query parameters
 */
export const matrixPaginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a positive number')
    .default('1')
    .transform(Number),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive number')
    .default('50')
    .transform(Number),
  deviceId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid device ID format')
    .optional(),
  tripId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid trip ID format')
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
