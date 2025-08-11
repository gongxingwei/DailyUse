import bcrypt from 'bcryptjs';
import type { PasswordHasherPort } from '@dailyuse/domain';

export class BcryptHasher implements PasswordHasherPort {
  async hash(plain: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain, salt);
  }
  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
