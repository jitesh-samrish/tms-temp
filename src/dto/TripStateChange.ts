import { Command } from './Command';

export class TripStateChange {
  public changeId: string | null = null;
  public tripId: string;
  public eventName: string;
  public commandIssuer: string;
  public changeTime: Date;
  public payload: Record<string, any>;
  public version: number = 1; // Default to version 1

  constructor(command: Command) {
    this.tripId = command.tripId;
    this.eventName = command.action;
    this.commandIssuer = command.commandIssuer;
    this.payload = command.payload;
    this.changeTime = new Date();
  }

  public setChangeId(id: string): void {
    this.changeId = id;
  }

  public setVersion(version: number): void {
    this.version = version;
  }
}
