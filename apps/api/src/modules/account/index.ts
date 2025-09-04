// Account module exports
export { AccountApplicationService } from './application/services/AccountApplicationService';
export type {
  UpdateAccountDto,
  AccountResponseDto,
} from './application/services/AccountApplicationService';

export { AccountController } from './interface/http/controllers/AccountController';
export {
  PrismaAccountRepository,
  PrismaUserRepository,
} from './infrastructure/repositories/prisma';
export { EmailService } from './domain/EmailService';
export { AccountValidationService } from './infrastructure/AccountValidationService';

// Infrastructure exports
export { accountContainer } from './infrastructure/di/container';
export * from './infrastructure';

// Routes
export { default as accountRoutes } from './interface/http/routes';

// Initialization
export { registerAccountInitializationTasks } from './initialization/accountInitialization';

// event system
export { registerAccountEventHandlers } from './application/events/accountHandlers';
