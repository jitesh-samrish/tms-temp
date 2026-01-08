import { z } from 'zod';

/**
 * Schema for creating trips from trip plan
 * POST /api/v1/trips
 */
export const createTripSchema = z.object({
  tripPlanId: z.string().min(1, 'Trip plan ID is required'),
});

/**
 * Schema for trip ID param
 * Used in multiple routes like GET, PUT, DELETE /api/v1/trips/:tripId
 */
export const tripIdParamSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
});

/**
 * Schema for cancelling a trip
 * POST /api/v1/trips/:tripId/cancel
 */
export const cancelTripSchema = z.object({
  reason: z.string().trim().optional(),
});

/**
 * Schema for updating trip ACL
 * PUT /api/v1/trips/:tripId/acl
 */
export const updateTripACLSchema = z
  .object({
    targetUserId: z.string().min(1, 'Target user ID is required'),
    role: z.string().optional(),
    action: z.enum(['add', 'remove'], {
      message: 'Action must be either "add" or "remove"',
    }),
  })
  .refine(
    (data) => {
      // If action is 'add', role is required
      if (data.action === 'add' && !data.role) {
        return false;
      }
      return true;
    },
    {
      message: 'Role is required when action is "add"',
      path: ['role'],
    }
  );
