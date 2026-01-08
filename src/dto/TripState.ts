/**
 * Represents the current state of a trip for command processing
 * This is an in-memory representation used during state transitions
 */
export class TripState {
  public status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  public tripPlanId: string;
  public startTime: Date;
  public endTime: Date;
  public acl: Array<{ userId: string; role: string }>;

  constructor(
    public tripId: string,
    tripPlanId: string,
    status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' = 'PLANNED',
    startTime: Date,
    endTime: Date,
    acl: Array<{ userId: string; role: string }> = []
  ) {
    this.tripPlanId = tripPlanId;
    this.status = status;
    this.startTime = startTime;
    this.endTime = endTime;
    this.acl = acl;
  }

  // Update trip status
  public setStatus(
    status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  ): void {
    this.status = status;
  }

  // Update trip times
  public setStartTime(startTime: Date): void {
    this.startTime = startTime;
  }

  public setEndTime(endTime: Date): void {
    this.endTime = endTime;
  }

  // Update trip ACL
  public setACL(acl: Array<{ userId: string; role: string }>): void {
    this.acl = acl;
  }

  // Add user to ACL
  public addUserToACL(userId: string, role: string): void {
    this.acl.push({ userId, role });
  }

  // Remove user from ACL
  public removeUserFromACL(userId: string): void {
    this.acl = this.acl.filter((entry) => entry.userId !== userId);
  }

  // Check if trip can be started
  public canStart(): boolean {
    return this.status === 'PLANNED';
  }

  // Check if trip can be completed
  public canComplete(): boolean {
    return this.status === 'ACTIVE';
  }

  // Check if trip can be cancelled
  public canCancel(): boolean {
    return this.status === 'PLANNED' || this.status === 'ACTIVE';
  }
}
