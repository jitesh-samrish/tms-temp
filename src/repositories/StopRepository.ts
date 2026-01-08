import { StopModel, IStop } from '../models/Stop.model';
import mongoose from 'mongoose';
import { Logger } from '../utils/Logger';

const logger = Logger.create('StopRepository');

export interface IStopRepository {
  createStop(
    name: string,
    latitude: number,
    longitude: number,
    address: string,
    createdBy: string
  ): Promise<IStop>;
  getAllStops(): Promise<IStop[]>;
  searchStopByName(searchTerm: string): Promise<IStop[]>;
  getStopById(stopId: string): Promise<IStop | null>;
}

export class StopRepository implements IStopRepository {
  async createStop(
    name: string,
    latitude: number,
    longitude: number,
    address: string,
    createdBy: string
  ): Promise<IStop> {
    const newStop = new StopModel({
      name,
      latitude,
      longitude,
      address,
      createdBy: new mongoose.Types.ObjectId(createdBy),
      updatedBy: new mongoose.Types.ObjectId(createdBy),
    });

    await newStop.save();
    logger.info(`Stop created: ${name} (ID: ${newStop._id})`);
    return newStop;
  }

  async getAllStops(): Promise<IStop[]> {
    return await StopModel.find().sort({ name: 1 }).exec();
  }

  async searchStopByName(searchTerm: string): Promise<IStop[]> {
    // Case-insensitive search using regex
    const stops = await StopModel.find({
      name: { $regex: searchTerm, $options: 'i' },
    })
      .sort({ name: 1 })
      .exec();

    logger.info(`Found ${stops.length} stops matching search: ${searchTerm}`);
    return stops;
  }

  async getStopById(stopId: string): Promise<IStop | null> {
    if (!mongoose.Types.ObjectId.isValid(stopId)) return null;
    return await StopModel.findById(stopId).exec();
  }
}
