export class CommonUtils {
  /**
   * Generates a random 4-digit OTP
   * @returns A 4-digit numeric string
   */
  static generateOTP(): string {
    const otp = Math.floor(1000 + Math.random() * 9000);
    return otp.toString();
  }

  /**
   * Calculates OTP expiration time (default: 5 minutes from now)
   * @param minutes Number of minutes until expiration
   * @returns Date object representing expiration time
   */
  static getExpirationTime(minutes: number = 5): Date {
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + minutes);
    return expirationTime;
  }

  /**
   * Checks if an OTP has expired
   * @param expiresAt The expiration date
   * @returns true if expired, false otherwise
   */
  static isExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }
}
