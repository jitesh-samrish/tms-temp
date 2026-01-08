import { z } from 'zod';

/**
 * Schema for creating a stop
 * POST /api/v1/stops
 */
export const createStopSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  address: z.string().min(1, 'Address is required').trim(),
});

/**
 * Schema for search query parameter
 * GET /api/v1/stops/search?name=searchTerm
 */
export const searchStopQuerySchema = z.object({
  name: z.string().min(1, 'Search name parameter is required'),
});
