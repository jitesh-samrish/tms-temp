import mongoose from 'mongoose';
import { DriverAssociationTokenRepository } from '../repositories/DriverAssociationTokenRepository';
import { DriverRepository } from '../repositories/DriverRepository';
import { DeviceDriverRepository } from '../repositories/DeviceDriverRepository';
import { TripDriverRepository } from '../repositories/TripDriverRepository';
import { SessionModel } from '../models/Sessiong.model';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '../utils/errors';
import { TripModel } from '../models';

export class DriverService {
  constructor(
    private driverAssociationTokenRepo: DriverAssociationTokenRepository,
    private driverRepo: DriverRepository,
    private deviceDriverRepo: DeviceDriverRepository,
    private tripDriverRepo: TripDriverRepository
  ) {}

  /**
   * Generate a 6-digit token for driver association that expires in 5 minutes
   */
  async generateToken(
    sessionId: string
  ): Promise<{ token: number; expiresAt: Date }> {
    // Verify session exists
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Generate a random 6-digit token
    const token = Math.floor(100000 + Math.random() * 900000);

    // Set expiry to 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save token
    await this.driverAssociationTokenRepo.createToken(
      new mongoose.Types.ObjectId(sessionId),
      token,
      expiresAt
    );

    return { token, expiresAt };
  }

  /**
   * Associate a driver with a trip using a token
   * Steps:
   * 1. Verify requesting user is admin in the trip
   * 2. Fetch and validate token
   * 3. Verify session is still valid
   * 4. Fetch userId from session
   * 5. Fetch driverId using userId
   * 6. Fetch deviceId from session
   * 7. Create DeviceDriver association
   * 8. Create TripDriver association
   */
  async associateDriverWithTrip(
    token: number,
    tripId: string,
    requestingUserId: string
  ): Promise<{
    driverId: mongoose.Types.ObjectId;
    deviceId: mongoose.Types.ObjectId;
    tripId: mongoose.Types.ObjectId;
  }> {
    const tripObjectId = new mongoose.Types.ObjectId(tripId);

    // Step 1: Verify requesting user is admin in the trip
    const trip = await TripModel.findById(tripObjectId);
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const isAdmin = trip.acl?.some(
      (aclEntry) =>
        aclEntry.userId.toString() === requestingUserId &&
        aclEntry.role === 'ADMIN'
    );
    if (!isAdmin) {
      throw new ForbiddenException(
        'Only trip admins can associate drivers with trips'
      );
    }

    // Step 2: Fetch and validate token
    const tokenDoc = await this.driverAssociationTokenRepo.getTokenByValue(
      token
    );
    if (!tokenDoc) {
      throw new NotFoundException('Invalid token');
    }

    // Check if token has expired
    if (new Date() > tokenDoc.expiresAt) {
      throw new BadRequestException('Token has expired');
    }

    // Step 3: Verify session is still valid
    const session = await SessionModel.findById(tokenDoc.sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Check if session is still active (not logged out)
    if (
      session.status != 'ACTIVE' ||
      (session.expiredAt && new Date() > session.expiredAt)
    ) {
      throw new BadRequestException('Session is no longer active');
    }

    // Step 4: Fetch userId from session
    const userId = session.userId;

    // Step 5: Fetch driverId using userId
    const driver = await this.driverRepo.getDriverByUserId(userId);
    if (!driver) {
      throw new NotFoundException('Driver not found for this user');
    }

    // Step 6: Fetch deviceId from session
    const deviceId = session.deviceId;
    if (!deviceId) {
      throw new BadRequestException(
        'Session does not have an associated device'
      );
    }

    // Step 7: Create DeviceDriver association (disassociate any existing ones first)
    await this.deviceDriverRepo.disassociateAllForDriver(driver._id);
    const deviceDriverAssociation =
      await this.deviceDriverRepo.createAssociation(deviceId, driver._id);

    // Step 8: Create TripDriver association (disassociate any existing ones first)
    await this.tripDriverRepo.disassociateAllForTrip(tripObjectId);
    const tripDriverAssociation = await this.tripDriverRepo.createAssociation(
      driver._id,
      tripObjectId
    );

    // Delete the token after successful use
    await this.driverAssociationTokenRepo.deleteToken(tokenDoc._id);

    return {
      driverId: driver._id,
      deviceId: deviceId,
      tripId: tripObjectId,
    };
  }
}
