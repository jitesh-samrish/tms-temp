import { z } from 'zod';

// Schema for schedule stop (used in trip plan schedule)
const scheduleStopSchema = z.object({
  stopId: z.string().min(1, 'Stop ID is required'),
  sequence: z.number().int().positive('Sequence must be a positive integer'),
  arrivalTime: z
    .number()
    .int()
    .min(0)
    .max(2359)
    .refine(
      (val) => {
        const hours = Math.floor(val / 100);
        const minutes = val % 100;
        return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
      },
      { message: 'Invalid military time format (e.g., 1030, 2210)' }
    ),
  departureTime: z
    .number()
    .int()
    .min(0)
    .max(2359)
    .refine(
      (val) => {
        const hours = Math.floor(val / 100);
        const minutes = val % 100;
        return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
      },
      { message: 'Invalid military time format (e.g., 1030, 2210)' }
    ),
});

// Schema for passenger input
const passengerSchema = z.object({
  name: z.string().min(1, 'Passenger name is required').trim(),
  phoneNumber: z.string().min(1, 'Phone number is required').trim(),
  pickupStopId: z.string().min(1, 'Pickup stop ID is required'),
  dropoffStopId: z.string().min(1, 'Dropoff stop ID is required'),
});

// Schema for date range
const dateRangeSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid start date format',
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid end date format',
  }),
});

/**
 * Schema for creating trip plan with basic details
 * POST /api/v1/trip-plans/basic
 */
export const createTripPlanBasicSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  description: z.string().trim().optional(),
  schedule: z.array(scheduleStopSchema).optional(),
  dateRanges: z.array(dateRangeSchema).optional(),
  passengers: z.array(passengerSchema).optional(),
});

/**
 * Schema for attaching schedule to trip plan
 * POST /api/v1/trip-plans/schedule
 */
export const attachScheduleSchema = z.object({
  tripPlanId: z.string().min(1, 'Trip plan ID is required'),
  schedule: z
    .array(scheduleStopSchema)
    .min(1, 'At least one schedule stop is required'),
  dateRanges: z.array(dateRangeSchema).optional(),
  passengers: z.array(passengerSchema).optional(),
});

/**
 * Schema for setting date ranges in trip plan
 * POST /api/v1/trip-plans/date-ranges
 */
export const setDateRangesSchema = z.object({
  tripPlanId: z.string().min(1, 'Trip plan ID is required'),
  dateRanges: z
    .array(dateRangeSchema)
    .min(1, 'At least one date range is required'),
  passengers: z.array(passengerSchema).optional(),
});

/**
 * Schema for setting passengers in trip plan
 * POST /api/v1/trip-plans/passengers
 */
export const setPassengersSchema = z.object({
  tripPlanId: z.string().min(1, 'Trip plan ID is required'),
  passengers: z
    .array(passengerSchema)
    .min(1, 'At least one passenger is required'),
});

/**
 * Schema for trip plan ID param
 * GET /api/v1/trip-plans/:tripPlanId
 */
export const tripPlanIdParamSchema = z.object({
  tripPlanId: z.string().min(1, 'Trip plan ID is required'),
});
