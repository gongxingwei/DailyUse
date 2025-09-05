// Export types and interfaces from domain-server
export type {
  IAuthCredentialRepository,
  ISessionRepository,
  ITokenRepository,
  IMFADeviceRepository,
} from '@dailyuse/domain-server';

// Export main classes
export { AuthenticationApplicationService } from './application/services/AuthenticationApplicationService';
export { AuthenticationController } from './interface/http/controller';

// Export infrastructure
export {
  PrismaAuthCredentialRepository,
  PrismaSessionRepository,
  PrismaTokenRepository,
  PrismaMFADeviceRepository,
} from './infrastructure/repositories/prisma';
export { authenticationContainer } from './infrastructure/di/container';

// Export routes
export { authenticationRoutes } from './interface/http/routes';

// Export initialization
export { registerAuthenticationInitializationTasks } from './initialization/authenticationInitialization';
