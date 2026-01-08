import { ITripPlan } from '../models/TripPlan.model';
import { TripPlanRepository } from '../repositories/TripPlanRepository';
import {
  PassengerRepository,
  IPassengerInput,
} from '../repositories/PassengerRepository';
import {
  TripPlanScheduleRepository,
  IScheduleStopInput,
} from '../repositories/TripPlanScheduleRepository';
import { ConflictException, NotFoundException } from '../utils/errors';
import { Logger } from '../utils/Logger';

const logger = Logger.create('TripPlanService');

export interface ITripPlanService {
  createTripPlanBasic(
    name: string,
    userId: string,
    description?: string,
    schedule?: IScheduleStopInput[],
    dateRanges?: Array<{ startDate: string; endDate: string }>,
    passengers?: IPassengerInput[]
  ): Promise<ITripPlan>;

  attachScheduleToTripPlan(
    tripPlanId: string,
    schedule: IScheduleStopInput[],
    userId: string,
    dateRanges?: Array<{ startDate: string; endDate: string }>,
    passengers?: IPassengerInput[]
  ): Promise<ITripPlan>;

  setDateRangesInTripPlan(
    tripPlanId: string,
    dateRanges: Array<{ startDate: string; endDate: string }>,
    userId: string,
    passengers?: IPassengerInput[]
  ): Promise<ITripPlan>;

  setPassengersInTripPlan(
    tripPlanId: string,
    passengers: IPassengerInput[],
    userId: string
  ): Promise<ITripPlan>;

  getTripPlanById(tripPlanId: string): Promise<ITripPlan>;
}

export { IScheduleStopInput };

export class TripPlanService implements ITripPlanService {
  private tripPlanRepository: TripPlanRepository;
  private passengerRepository: PassengerRepository;
  private scheduleRepository: TripPlanScheduleRepository;

  constructor() {
    this.tripPlanRepository = new TripPlanRepository();
    this.passengerRepository = new PassengerRepository();
    this.scheduleRepository = new TripPlanScheduleRepository();
  }

  /**
   * API 1: Create trip plan with basic details
   * Times in schedule are in military format: 1030 = 10:30 AM, 2210 = 10:10 PM
   */
  async createTripPlanBasic(
    name: string,
    userId: string,
    description?: string,
    schedule?: IScheduleStopInput[],
    dateRanges?: Array<{ startDate: string; endDate: string }>,
    passengers?: IPassengerInput[]
  ): Promise<ITripPlan> {
    logger.info(`Creating trip plan with name: ${name}`);

    // Convert date strings to Date objects
    const convertedDateRanges = dateRanges
      ? dateRanges.map((range) => ({
          startDate: new Date(range.startDate),
          endDate: new Date(range.endDate),
        }))
      : [];

    // Calculate startTime and endTime from schedule if provided
    let startTime = 0;
    let endTime = 0;
    if (schedule && schedule.length > 0) {
      // Sort by sequence to get first and last stops
      const sortedSchedule = [...schedule].sort(
        (a, b) => a.sequence - b.sequence
      );
      startTime = sortedSchedule[0].departureTime;
      endTime = sortedSchedule[sortedSchedule.length - 1].arrivalTime;
    }

    console.log('Converted Date Ranges:', convertedDateRanges);
    console.log('Start Time:', startTime);
    console.log('End Time:', endTime);

    const tripPlan = await this.tripPlanRepository.createTripPlan(
      name,
      description,
      userId,
      startTime,
      endTime,
      convertedDateRanges
    );

    // Create schedule stops if provided
    if (schedule && schedule.length > 0) {
      await this.scheduleRepository.createScheduleStops(
        tripPlan._id.toString(),
        schedule,
        userId
      );
    }

    // Create passengers if provided
    if (passengers && passengers.length > 0) {
      await this.passengerRepository.createPassengers(
        tripPlan._id.toString(),
        passengers,
        userId
      );
    }

    logger.info(`Trip plan created successfully: ${tripPlan._id}`);
    return tripPlan;
  }

  /**
   * API 2: Attach schedule to an existing trip plan
   * Times in schedule are in military format: 1030 = 10:30 AM, 2210 = 10:10 PM
   */
  async attachScheduleToTripPlan(
    tripPlanId: string,
    schedule: IScheduleStopInput[],
    userId: string,
    dateRanges?: Array<{ startDate: string; endDate: string }>,
    passengers?: IPassengerInput[]
  ): Promise<ITripPlan> {
    logger.info(`Attaching schedule to trip plan: ${tripPlanId}`);

    // Check if trip plan exists
    const existingTripPlan = await this.tripPlanRepository.getTripPlanById(
      tripPlanId
    );
    if (!existingTripPlan) {
      throw new NotFoundException('Trip plan not found');
    }

    // Check if schedule already exists
    const existingSchedule =
      await this.scheduleRepository.getScheduleStopsByTripPlan(tripPlanId);
    if (existingSchedule.length > 0) {
      throw new ConflictException('Schedule already exists in this trip plan');
    }

    // Calculate startTime and endTime from schedule
    const sortedSchedule = [...schedule].sort(
      (a, b) => a.sequence - b.sequence
    );
    const startTime = sortedSchedule[0].departureTime;
    const endTime = sortedSchedule[sortedSchedule.length - 1].arrivalTime;

    // Prepare update data
    const updateData: any = {
      startTime,
      endTime,
      updatedBy: userId,
    };

    // Add date ranges if provided
    if (dateRanges) {
      // Check if date ranges already exist
      if (
        existingTripPlan.dateRanges &&
        existingTripPlan.dateRanges.length > 0
      ) {
        throw new ConflictException(
          'Date ranges already exist in this trip plan'
        );
      }
      updateData.dateRanges = dateRanges.map((range) => ({
        startDate: new Date(range.startDate),
        endDate: new Date(range.endDate),
      }));
    }

    // Update trip plan
    const updatedTripPlan = await this.tripPlanRepository.updateTripPlan(
      tripPlanId,
      updateData
    );

    if (!updatedTripPlan) {
      throw new NotFoundException('Failed to update trip plan');
    }

    // Create schedule stops
    await this.scheduleRepository.createScheduleStops(
      tripPlanId,
      schedule,
      userId
    );

    // Create passengers if provided
    if (passengers && passengers.length > 0) {
      // Check if passengers already exist
      const existingPassengers =
        await this.passengerRepository.getPassengersByTripPlan(tripPlanId);
      if (existingPassengers.length > 0) {
        throw new ConflictException(
          'Passengers already exist in this trip plan'
        );
      }

      await this.passengerRepository.createPassengers(
        tripPlanId,
        passengers,
        userId
      );
    }

    logger.info(`Schedule attached successfully to trip plan: ${tripPlanId}`);
    return updatedTripPlan;
  }

  /**
   * API 3: Set date ranges in trip plan
   */
  async setDateRangesInTripPlan(
    tripPlanId: string,
    dateRanges: Array<{ startDate: string; endDate: string }>,
    userId: string,
    passengers?: IPassengerInput[]
  ): Promise<ITripPlan> {
    logger.info(`Setting date ranges for trip plan: ${tripPlanId}`);

    // Check if trip plan exists
    const existingTripPlan = await this.tripPlanRepository.getTripPlanById(
      tripPlanId
    );
    if (!existingTripPlan) {
      throw new NotFoundException('Trip plan not found');
    }

    // Check if date ranges already exist
    if (existingTripPlan.dateRanges && existingTripPlan.dateRanges.length > 0) {
      throw new ConflictException(
        'Date ranges already exist in this trip plan'
      );
    }

    // Convert date strings to Date objects
    const convertedDateRanges = dateRanges.map((range) => ({
      startDate: new Date(range.startDate),
      endDate: new Date(range.endDate),
    }));

    // Update trip plan with date ranges
    const updatedTripPlan = await this.tripPlanRepository.updateTripPlan(
      tripPlanId,
      {
        dateRanges: convertedDateRanges,
        updatedBy: userId,
      }
    );

    if (!updatedTripPlan) {
      throw new NotFoundException('Failed to update trip plan');
    }

    // Create passengers if provided
    if (passengers && passengers.length > 0) {
      // Check if passengers already exist
      const existingPassengers =
        await this.passengerRepository.getPassengersByTripPlan(tripPlanId);
      if (existingPassengers.length > 0) {
        throw new ConflictException(
          'Passengers already exist in this trip plan'
        );
      }

      await this.passengerRepository.createPassengers(
        tripPlanId,
        passengers,
        userId
      );
    }

    logger.info(`Date ranges set successfully for trip plan: ${tripPlanId}`);
    return updatedTripPlan;
  }

  /**
   * API 4: Set passengers list in trip plan
   */
  async setPassengersInTripPlan(
    tripPlanId: string,
    passengers: IPassengerInput[],
    userId: string
  ): Promise<ITripPlan> {
    logger.info(`Setting passengers for trip plan: ${tripPlanId}`);

    // Check if trip plan exists
    const existingTripPlan = await this.tripPlanRepository.getTripPlanById(
      tripPlanId
    );
    if (!existingTripPlan) {
      throw new NotFoundException('Trip plan not found');
    }

    // Check if passengers already exist
    const existingPassengers =
      await this.passengerRepository.getPassengersByTripPlan(tripPlanId);
    if (existingPassengers.length > 0) {
      throw new ConflictException('Passengers already exist in this trip plan');
    }

    // Create passengers
    await this.passengerRepository.createPassengers(
      tripPlanId,
      passengers,
      userId
    );

    logger.info(`Passengers set successfully for trip plan: ${tripPlanId}`);
    return existingTripPlan;
  }

  /**
   * Get trip plan by ID
   */
  async getTripPlanById(tripPlanId: string): Promise<ITripPlan> {
    const tripPlan = await this.tripPlanRepository.getTripPlanById(tripPlanId);
    if (!tripPlan) {
      throw new NotFoundException('Trip plan not found');
    }
    return tripPlan;
  }
}
