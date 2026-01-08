import { IStop } from '../models/Stop.model';
import { StopRepository } from '../repositories/StopRepository';
import { Logger } from '../utils/Logger';

const logger = Logger.create('StopService');

export interface IStopService {
  createStop(
    name: string,
    latitude: number,
    longitude: number,
    address: string,
    userId: string
  ): Promise<IStop>;
  getAllStops(): Promise<IStop[]>;
  searchStopByName(searchTerm: string): Promise<IStop[]>;
}

export class StopService implements IStopService {
  private stopRepository: StopRepository;

  constructor() {
    this.stopRepository = new StopRepository();
  }

  /**
   * Create a new stop
   */
  async createStop(
    name: string,
    latitude: number,
    longitude: number,
    address: string,
    userId: string
  ): Promise<IStop> {
    logger.info(`Creating stop: ${name}`);

    const stop = await this.stopRepository.createStop(
      name,
      latitude,
      longitude,
      address,
      userId
    );

    logger.info(`Stop created successfully: ${stop._id}`);
    return stop;
  }

  /**
   * Get all stops
   */
  async getAllStops(): Promise<IStop[]> {
    logger.info('Fetching all stops');
    return await this.stopRepository.getAllStops();
  }

  /**
   * Search stops by name
   */
  async searchStopByName(searchTerm: string): Promise<IStop[]> {
    logger.info(`Searching stops by name: ${searchTerm}`);
    return await this.stopRepository.searchStopByName(searchTerm);
  }
}
