import mongoose from 'mongoose';
import DriverAssociationTokenModel from '../models/DriverAssociationToken.model';
import { IDriverAssociationToken } from 'tms-common-db/schemas/driverAssociationToken.schema';

export interface IDriverAssociationTokenRepository {
  createToken(
    sessionId: mongoose.Types.ObjectId,
    token: number,
    expiresAt: Date
  ): Promise<IDriverAssociationToken>;
  getTokenByValue(token: number): Promise<IDriverAssociationToken | null>;
  deleteToken(tokenId: mongoose.Types.ObjectId): Promise<boolean>;
}

export class DriverAssociationTokenRepository
  implements IDriverAssociationTokenRepository
{
  async createToken(
    sessionId: mongoose.Types.ObjectId,
    token: number,
    expiresAt: Date
  ): Promise<IDriverAssociationToken> {
    const tokenDoc = new DriverAssociationTokenModel({
      sessionId,
      token,
      expiresAt,
    });
    return await tokenDoc.save();
  }

  async getTokenByValue(
    token: number
  ): Promise<IDriverAssociationToken | null> {
    return await DriverAssociationTokenModel.findOne({ token });
  }

  async deleteToken(tokenId: mongoose.Types.ObjectId): Promise<boolean> {
    const result = await DriverAssociationTokenModel.deleteOne({
      _id: tokenId,
    });
    return result.deletedCount > 0;
  }
}
