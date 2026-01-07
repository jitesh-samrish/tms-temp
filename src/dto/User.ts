export class User {
  public id: number;
  public username: string;
  public createdAt: Date;

  constructor(id: number, username: string, createdAt: Date = new Date()) {
    this.id = id;
    this.username = username;
    this.createdAt = createdAt;
  }
}
