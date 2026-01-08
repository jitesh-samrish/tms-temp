import { z } from 'zod';

// Schema for associating a driver with a trip
export const associateDriverWithTripSchema = z.object({
  token: z
    .number()
    .int('Token must be an integer')
    .min(100000, 'Token must be a 6-digit number')
    .max(999999, 'Token must be a 6-digit number'),
  tripId: z.string().min(1, 'Trip ID is required'),
});
