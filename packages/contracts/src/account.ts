import { z } from 'zod';

export enum AccountStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum AccountType {
  LOCAL = 'local',
  ONLINE = 'online',
  GUEST = 'guest',
}

export const AccountDTO = z.object({
  uuid: z.string(),
  username: z.string(),
  status: z.nativeEnum(AccountStatus),
  accountType: z.nativeEnum(AccountType),
  createdAt: z.date().or(z.string().transform((s) => new Date(s))),
  updatedAt: z.date().or(z.string().transform((s) => new Date(s))),
  lastLoginAt: z
    .date()
    .optional()
    .or(
      z
        .string()
        .optional()
        .transform((s) => (s ? new Date(s) : undefined)),
    ),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  emailVerificationToken: z.string().optional(),
  phoneVerificationCode: z.string().optional(),
  isEmailVerified: z.boolean(),
  isPhoneVerified: z.boolean(),
  roleIds: z.set(z.string()).optional(),
  user: z.any(),
});
export type AccountDTO = z.infer<typeof AccountDTO>;

export const RegisterRequest = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  accountType: z.nativeEnum(AccountType).default(AccountType.LOCAL),
});
export type RegisterRequest = z.infer<typeof RegisterRequest>;

export const LoginRequest = z.object({
  username: z.string(),
  password: z.string(),
});
export type LoginRequest = z.infer<typeof LoginRequest>;

export const AuthResponse = z.object({
  user: z.any(),
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthResponse = z.infer<typeof AuthResponse>;
