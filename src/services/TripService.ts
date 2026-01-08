import { ITripRepository } from '../repositories/TripRepository';
import { ITripPlanRepository } from '../repositories/TripPlanRepository';
import { StateService } from './StateService';
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '../utils/errors';
import { Command } from '../dto/Command';
import { Logger } from '../utils/Logger';
import mongoose from 'mongoose';
import { IChangeRepository } from '../repositories/ChangeRepository';

const logger = Logger.create('TripService');

export interface ITripService {
  createTrip(
    tripPlanId: string,
    startTime: Date,
    endTime: Date,
    createdBy: string,
    acl?: Array<{ userId: string; role: string }>
  ): Promise<any>;
  getTripById(tripId: string, userId: string): Promise<any>;
  getTripsByUser(userId: string): Promise<any[]>;
  startTrip(tripId: string, userId: string): Promise<any>;
  completeTrip(tripId: string, userId: string): Promise<any>;
  cancelTrip(tripId: string, userId: string, reason?: string): Promise<any>;
  updateTripACL(
    tripId: string,
    requestingUserId: string,
    targetUserId: string,
    role: string,
    action: 'add' | 'remove'
  ): Promise<any>;
}

export class TripService implements ITripService {
  constructor(
    private tripRepository: ITripRepository,
    private tripPlanRepository: ITripPlanRepository,
    private changeRepository: IChangeRepository
  ) {}

  private stateService = new StateService(
    this.tripRepository,
    this.changeRepository
  );

  async createTrip(
    tripPlanId: string,
    startTime: Date,
    endTime: Date,
    createdBy: string,
    acl: Array<{ userId: string; role: string }> = []
  ): Promise<any> {
    // Validate that the trip plan exists
    const tripPlan = await this.tripPlanRepository.getTripPlanById(tripPlanId);
    if (!tripPlan) {
      throw new NotFoundException(`Trip plan ${tripPlanId} not found`);
    }

    // Validate start time is before end time
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Generate a new trip ID
    const tripId = new mongoose.Types.ObjectId().toString();

    // Create command
    const command = new Command(tripId, createdBy, 'CREATE_TRIP', {
      tripPlanId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      createdBy,
      acl,
    });

    // Execute command through StateService
    const change = await this.stateService.executeCommand(command);

    // Fetch the created trip
    const trip = await this.tripRepository.getTripById(tripId);

    logger.info(`Trip ${tripId} created for trip plan ${tripPlanId}`);

    return {
      tripId: trip!._id.toString(),
      tripPlanId: trip!.tripPlanId.toString(),
      startTime: trip!.startTime,
      endTime: trip!.endTime,
      status: trip!.status,
      acl: trip!.acl,
      createdAt: trip!.createdAt,
    };
  }

  async getTripById(tripId: string, userId: string): Promise<any> {
    const trip = await this.tripRepository.getTripById(tripId);
    if (!trip) {
      throw new NotFoundException(`Trip ${tripId} not found`);
    }

    // Check if user has access to this trip
    const hasAccess = trip.acl.some((a) => a.userId.toString() === userId);
    if (!hasAccess && trip.createdBy.toString() !== userId) {
      throw new UnauthorizedException('You do not have access to this trip');
    }

    return {
      tripId: trip._id.toString(),
      tripPlanId: trip.tripPlanId.toString(),
      startTime: trip.startTime,
      endTime: trip.endTime,
      status: trip.status,
      acl: trip.acl.map((a) => ({
        userId: a.userId.toString(),
        role: a.role,
      })),
      createdBy: trip.createdBy.toString(),
      updatedBy: trip.updatedBy.toString(),
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    };
  }

  async getTripsByUser(userId: string): Promise<any[]> {
    const trips = await this.tripRepository.getTripsByUserACL(userId);

    return trips.map((trip) => ({
      tripId: trip._id.toString(),
      tripPlanId: trip.tripPlanId.toString(),
      startTime: trip.startTime,
      endTime: trip.endTime,
      status: trip.status,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    }));
  }

  async startTrip(tripId: string, userId: string): Promise<any> {
    // Verify trip exists and user has access
    const trip = await this.tripRepository.getTripById(tripId);
    if (!trip) {
      throw new NotFoundException(`Trip ${tripId} not found`);
    }

    // Check if user has permission (must be in ACL or be creator)
    const hasAccess = trip.acl.some((a) => a.userId.toString() === userId);
    if (!hasAccess && trip.createdBy.toString() !== userId) {
      throw new UnauthorizedException(
        'You do not have permission to start this trip'
      );
    }

    // Create command to start trip
    const command = new Command(tripId, userId, 'START_TRIP', {});

    // Execute command through StateService
    await this.stateService.executeCommand(command);

    // Fetch updated trip
    const updatedTrip = await this.tripRepository.getTripById(tripId);

    logger.info(`Trip ${tripId} started by user ${userId}`);

    return {
      tripId: updatedTrip!._id.toString(),
      status: updatedTrip!.status,
      updatedAt: updatedTrip!.updatedAt,
    };
  }

  async completeTrip(tripId: string, userId: string): Promise<any> {
    // Verify trip exists and user has access
    const trip = await this.tripRepository.getTripById(tripId);
    if (!trip) {
      throw new NotFoundException(`Trip ${tripId} not found`);
    }

    // Check if user has permission (must be in ACL or be creator)
    const hasAccess = trip.acl.some((a) => a.userId.toString() === userId);
    if (!hasAccess && trip.createdBy.toString() !== userId) {
      throw new UnauthorizedException(
        'You do not have permission to complete this trip'
      );
    }

    // Create command to complete trip
    const command = new Command(tripId, userId, 'COMPLETE_TRIP', {});

    // Execute command through StateService
    await this.stateService.executeCommand(command);

    // Fetch updated trip
    const updatedTrip = await this.tripRepository.getTripById(tripId);

    logger.info(`Trip ${tripId} completed by user ${userId}`);

    return {
      tripId: updatedTrip!._id.toString(),
      status: updatedTrip!.status,
      updatedAt: updatedTrip!.updatedAt,
    };
  }

  async cancelTrip(
    tripId: string,
    userId: string,
    reason?: string
  ): Promise<any> {
    // Verify trip exists and user has access
    const trip = await this.tripRepository.getTripById(tripId);
    if (!trip) {
      throw new NotFoundException(`Trip ${tripId} not found`);
    }

    // Check if user has permission (must be in ACL or be creator)
    const hasAccess = trip.acl.some((a) => a.userId.toString() === userId);
    if (!hasAccess && trip.createdBy.toString() !== userId) {
      throw new UnauthorizedException(
        'You do not have permission to cancel this trip'
      );
    }

    // Create command to cancel trip
    const command = new Command(tripId, userId, 'CANCEL_TRIP', {
      ...(reason && { reason }),
    });

    // Execute command through StateService
    await this.stateService.executeCommand(command);

    // Fetch updated trip
    const updatedTrip = await this.tripRepository.getTripById(tripId);

    logger.info(`Trip ${tripId} cancelled by user ${userId}`);

    return {
      tripId: updatedTrip!._id.toString(),
      status: updatedTrip!.status,
      updatedAt: updatedTrip!.updatedAt,
    };
  }

  async updateTripACL(
    tripId: string,
    requestingUserId: string,
    targetUserId: string,
    role: string,
    action: 'add' | 'remove'
  ): Promise<any> {
    // Verify trip exists
    const trip = await this.tripRepository.getTripById(tripId);
    if (!trip) {
      throw new NotFoundException(`Trip ${tripId} not found`);
    }

    // Only the creator can modify ACL
    if (trip.createdBy.toString() !== requestingUserId) {
      throw new UnauthorizedException(
        'Only the trip creator can modify access control'
      );
    }

    let updatedTrip;
    if (action === 'add') {
      updatedTrip = await this.tripRepository.addUserToACL(
        tripId,
        targetUserId,
        role
      );
    } else {
      updatedTrip = await this.tripRepository.removeUserFromACL(
        tripId,
        targetUserId
      );
    }

    if (!updatedTrip) {
      throw new BadRequestException('Failed to update trip ACL');
    }

    logger.info(
      `Trip ${tripId} ACL updated: ${action} user ${targetUserId} with role ${role}`
    );

    return {
      tripId: updatedTrip._id.toString(),
      acl: updatedTrip.acl.map((a) => ({
        userId: a.userId.toString(),
        role: a.role,
      })),
    };
  }
}
