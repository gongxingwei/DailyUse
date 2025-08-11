import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import type { JwtPort } from '@dailyuse/domain';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'dev_secret';
const REFRESH_TOKEN_SECRET: Secret = process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret';

export class JwtAdapter implements JwtPort {
  sign(payload: any, opts?: { expiresIn?: string | number }): string {
    const options: SignOptions | undefined = opts
      ? { expiresIn: opts.expiresIn as any }
      : undefined;
    return jwt.sign(payload, JWT_SECRET, options);
  }
  verify<T = any>(token: string): T {
    return jwt.verify(token, JWT_SECRET) as T;
  }
}

export class RefreshJwtAdapter implements JwtPort {
  sign(payload: any, opts?: { expiresIn?: string | number }): string {
    const options: SignOptions | undefined = opts
      ? { expiresIn: opts.expiresIn as any }
      : undefined;
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, options);
  }
  verify<T = any>(token: string): T {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as T;
  }
}
