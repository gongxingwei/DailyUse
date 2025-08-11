// Export types and interfaces from domain-server
export type {
  IAuthCredentialRepository,
  ISessionRepository,
  ITokenRepository,
  IMFADeviceRepository,
} from '@dailyuse/domain-server';

export type {
  LoginRequest,
  LoginResponse,
  MFAVerificationRequest,
  MFAVerificationResponse,
  CreateMFADeviceRequest,
  CreateMFADeviceResponse,
} from './application/AuthenticationApplicationService';

// Export main classes
export { AuthenticationApplicationService } from './application/AuthenticationApplicationService';
export { AuthenticationController } from './presentation/AuthenticationController';

// Export infrastructure
export {
  PrismaAuthCredentialRepository,
  PrismaSessionRepository,
  PrismaTokenRepository,
  PrismaMFADeviceRepository,
} from './infrastructure/repositories/prisma';
export { authenticationContainer } from './infrastructure/container';

// Export routes
export { authenticationRoutes } from './interface/http/routes';
