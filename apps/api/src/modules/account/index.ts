// Account module exports
export { AccountApplicationService } from './application/AccountApplicationService';
export type {
  CreateAccountDto,
  UpdateAccountDto,
  AccountResponseDto,
} from './application/AccountApplicationService';

export { AccountController } from './application/AccountController';
export { PrismaAccountRepository } from './infrastructure/PrismaAccountRepository';
export { EmailService } from './domain/EmailService';
export { AccountValidationService } from './infrastructure/AccountValidationService';

// Routes
export { default as accountRoutes } from './interface/http/routes';
