export class Command {
  constructor(
    public queueId: string,
    public commandIssuer: string,
    public action: string, // e.g., "ISSUE_TOKEN"
    public payload: Record<string, any> // Flexible Map
  ) {}
}
