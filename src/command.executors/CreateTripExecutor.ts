import { CommandExecutor } from '../interfaces/CommandExecutor';
import { TripState } from '../dto/TripState';
import { TripStateChange } from '../dto/TripStateChange';
import { Command } from '../dto/Command';
import { ITripRepository } from '../repositories/TripRepository';
import { IChangeRepository } from '../repositories/ChangeRepository';
import { ITripPlanRepository } from '../repositories/TripPlanRepository';
import { TripPlanScheduleRepository } from '../repositories/TripPlanScheduleRepository';
import { TripScheduleRepository } from '../repositories/TripScheduleRepository';
import mongoose from 'mongoose';
import { Logger } from '../utils/Logger';
import { NotFoundException } from '../utils/errors';

const logger = Logger.create('CreateTripExecutor');

export class CreateTripExecutor implements CommandExecutor {
  constructor(
    private tripRepository: ITripRepository,
    private tripPlanRepository: ITripPlanRepository
  ) {}

  private tripPlanScheduleRepository = new TripPlanScheduleRepository();
  private tripScheduleRepository = new TripScheduleRepository();

  async executeCommand(
    tripState: TripState | undefined,
    command: Command,
    changeRepository: IChangeRepository,
    version: number
  ): Promise<{ tripState: TripState; change: TripStateChange }> {
    // Extract payload data
    const tripPlanId = String(command.payload['tripPlanId']);
    const userId = String(command.payload['userId']);
    const tripPlanAcl = command.payload['tripPlanAcl'] as Array<{
      userId: string;
      role: string;
    }>;

    // Fetch trip plan and validate
    const tripPlan = await this.tripPlanRepository.getTripPlanById(tripPlanId);
    if (!tripPlan) {
      throw new NotFoundException(`Trip plan ${tripPlanId} not found`);
    }

    // Fetch trip plan schedule
    const tripPlanSchedule =
      await this.tripPlanScheduleRepository.getScheduleStopsByTripPlan(
        tripPlanId
      );

    if (!tripPlanSchedule || tripPlanSchedule.length === 0) {
      throw new NotFoundException(
        `Trip plan ${tripPlanId} has no schedule stops defined`
      );
    }

    // Get all date ranges
    const dateRanges = tripPlan.dateRanges || [];

    // Create trips for each date in each date range
    const createdTrips: any[] = [];

    for (const dateRange of dateRanges) {
      const currentDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);

      // Iterate through each day in the date range
      while (currentDate <= endDate) {
        const tripId = new mongoose.Types.ObjectId();

        // Convert military time to actual Date objects for this specific day
        const startDateTime = this.militaryTimeToDate(
          currentDate,
          tripPlan.startTime || 0
        );
        const endDateTime = this.militaryTimeToDate(
          currentDate,
          tripPlan.endTime || 0
        );

        // Create trip in database with ACL from trip plan
        const trip = await this.tripRepository.createTrip(
          tripPlanId,
          startDateTime,
          endDateTime,
          userId,
          tripPlanAcl || [], // Copy ACL from trip plan
          tripId
        );

        // Create trip schedule from trip plan schedule
        const tripSchedules = tripPlanSchedule.map((planStop) => ({
          tripId: tripId.toString(),
          stopId: planStop.stopId.toString(),
          sequence: planStop.sequence,
          estimatedArrivalTime: this.militaryTimeToDate(
            currentDate,
            planStop.arrivalTime
          ),
          estimatedDepartureTime: this.militaryTimeToDate(
            currentDate,
            planStop.departureTime
          ),
          createdBy: userId,
        }));

        await this.tripScheduleRepository.createScheduleStops(tripSchedules);

        createdTrips.push(trip);

        logger.info(
          `Trip ${tripId} created for ${
            currentDate.toISOString().split('T')[0]
          }`
        );

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    logger.info(
      `Created ${createdTrips.length} trips for trip plan ${tripPlanId}`
    );

    // Create a dummy trip state since we're creating multiple trips
    const dummyTripState = new TripState(
      tripPlanId,
      tripPlanId,
      'PLANNED',
      new Date(),
      new Date(),
      []
    );

    // Create change entity and save it
    const change = await this.createAndSaveChange(
      command,
      changeRepository,
      version,
      { tripsCreated: createdTrips.length }
    );

    return { tripState: dummyTripState, change };
  }

  /**
   * Convert military time (e.g., 1030) to a Date object for a specific day
   */
  private militaryTimeToDate(date: Date, militaryTime: number): Date {
    const hours = Math.floor(militaryTime / 100);
    const minutes = militaryTime % 100;

    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);

    return result;
  }

  /**
   * Create and save change entity after executing business logic
   */
  private async createAndSaveChange(
    command: Command,
    changeRepository: IChangeRepository,
    version: number,
    additionalData?: Record<string, any>,
    timestamp?: Date
  ): Promise<TripStateChange> {
    // Update command payload with additional data
    if (additionalData) {
      command.payload = { ...command.payload, ...additionalData };
    }

    // Create change event
    const changeEvent = new TripStateChange(command);
    changeEvent.setVersion(version);

    // For CREATE_TRIP, we use tripPlanId as the trip reference
    const tripPlanId = new mongoose.Types.ObjectId(
      command.payload['tripPlanId']
    );
    const savedChange = await changeRepository.saveChange(
      tripPlanId,
      changeEvent,
      timestamp
    );
    changeEvent.setChangeId(savedChange._id.toString());

    logger.debug(
      `Created change ${savedChange._id} for CREATE_TRIP (v${version})`
    );

    return changeEvent;
  }
}
