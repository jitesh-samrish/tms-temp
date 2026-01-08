export class Command {
  constructor(
    public tripId: string,
    public commandIssuer: string,
    public action: string, // e.g., "CREATE_TRIP", "START_TRIP", "COMPLETE_TRIP", "CANCEL_TRIP"
    public payload: Record<string, any> // Flexible Map
  ) {}
}
