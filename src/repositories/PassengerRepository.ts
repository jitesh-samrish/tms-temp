import { PassengerModel, IPassenger } from '../models/Passenger.model';
import mongoose from 'mongoose';
import { Logger } from '../utils/Logger';

const logger = Logger.create('PassengerRepository');

export interface IPassengerInput {
  name: string;
  phoneNumber: string;
  pickupStopId: string;
  dropoffStopId: string;
}

export interface IPassengerRepository {
  createPassengers(
    tripPlanId: string,
    passengers: IPassengerInput[],
    createdBy: string
  ): Promise<IPassenger[]>;
  getPassengersByTripPlan(tripPlanId: string): Promise<IPassenger[]>;
  deletePassengersByTripPlan(tripPlanId: string): Promise<number>;
  updatePassengerStatus(
    passengerId: string,
    status: 'BOOKED' | 'CANCELLED' | 'COMPLETED'
  ): Promise<IPassenger | null>;
}

export class PassengerRepository implements IPassengerRepository {
  async createPassengers(
    tripPlanId: string,
    passengers: IPassengerInput[],
    createdBy: string
  ): Promise<IPassenger[]> {
    const passengerDocs = passengers.map((passenger) => ({
      tripPlanId: new mongoose.Types.ObjectId(tripPlanId),
      name: passenger.name,
      phoneNumber: passenger.phoneNumber,
      pickupStopId: new mongoose.Types.ObjectId(passenger.pickupStopId),
      dropoffStopId: new mongoose.Types.ObjectId(passenger.dropoffStopId),
      status: 'BOOKED' as const,
      createdBy: new mongoose.Types.ObjectId(createdBy),
      updatedBy: new mongoose.Types.ObjectId(createdBy),
    }));

    const createdPassengers = await PassengerModel.insertMany(passengerDocs);
    logger.info(
      `Created ${createdPassengers.length} passengers for trip plan ${tripPlanId}`
    );
    return createdPassengers;
  }

  async getPassengersByTripPlan(tripPlanId: string): Promise<IPassenger[]> {
    if (!mongoose.Types.ObjectId.isValid(tripPlanId)) return [];
    return await PassengerModel.find({
      tripPlanId: new mongoose.Types.ObjectId(tripPlanId),
    }).exec();
  }

  async deletePassengersByTripPlan(tripPlanId: string): Promise<number> {
    if (!mongoose.Types.ObjectId.isValid(tripPlanId)) return 0;

    const result = await PassengerModel.deleteMany({
      tripPlanId: new mongoose.Types.ObjectId(tripPlanId),
    }).exec();

    logger.info(
      `Deleted ${result.deletedCount} passengers for trip plan ${tripPlanId}`
    );
    return result.deletedCount || 0;
  }

  async updatePassengerStatus(
    passengerId: string,
    status: 'BOOKED' | 'CANCELLED' | 'COMPLETED'
  ): Promise<IPassenger | null> {
    if (!mongoose.Types.ObjectId.isValid(passengerId)) return null;

    const passenger = await PassengerModel.findByIdAndUpdate(
      passengerId,
      { $set: { status } },
      { new: true, runValidators: true }
    ).exec();

    if (passenger) {
      logger.info(`Passenger ${passengerId} status updated to ${status}`);
    }
    return passenger;
  }
}
