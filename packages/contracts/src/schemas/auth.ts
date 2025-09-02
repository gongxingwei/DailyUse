import { z } from 'zod';

// 注册请求 Schema
// export const RegisterRequestSchema = z
//   .object({
//     username: z.string().min(3).max(30),
//     email: z.string().email(),
//     password: z.string().min(6).max(100),
//     confirmPassword: z.string().min(6).max(100),
//     firstName: z.string().optional(),
//     lastName: z.string().optional(),
//   })
//   .refine((data) => data.password === data.confirmPassword, {
//     message: "Passwords don't match",
//     path: ['confirmPassword'],
//   });

// 登录请求 Schema
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// 用户响应 Schema
export const UserResponseSchema = z.object({
  uuid: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  sex: z.string().nullable(),
  avatar: z.string().nullable(),
  bio: z.string().nullable(),
  socialAccounts: z.record(z.string()),
});

// 账号响应 Schema
export const AccountResponseSchema = z.object({
  uuid: z.string(),
  username: z.string(),
  status: z.enum(['active', 'disabled', 'suspended', 'pending_verification']),
  accountType: z.enum(['local', 'online', 'guest']),
  email: z.string().optional(),
  isEmailVerified: z.boolean(),
  phone: z.string().optional(),
  isPhoneVerified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastLoginAt: z.date().optional(),
  user: UserResponseSchema,
});

// 认证响应 Schema
export const AuthResponseSchema = z.object({
  account: AccountResponseSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

// 错误响应 Schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
});

// TypeScript 类型导出
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type AccountResponse = z.infer<typeof AccountResponseSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
