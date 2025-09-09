// Authentication domain exports
export * from './authentication/aggregates/AuthCredential';
export * from './authentication/entities/MFADevice';
export * from './authentication/entities/Session';
export * from './authentication/valueObjects/Password';
export * from './authentication/valueObjects/Token';
export * from './authentication/repositories/IAuthenticationRepository';
export * from './authentication/events';

// Authentication types - specific exports to avoid conflicts
export type {
  IMFADeviceServer,
  ISessionServer,
  ITokenServer,
  IPasswordServer,
  IAuthCredentialServer,
} from './authentication/types/interfaces';

// Account domain exports
export * from './account/types';
export * from './account/aggregates/Account';
export * from './account/entities/User';
export * from './account/entities/Role';
export * from './account/entities/Permission';
export * from './account/valueObjects/Email';
export * from './account/valueObjects/PhoneNumber';
export * from './account/valueObjects/Address';
export * from './account/repositories/IAccountRepository';
export * from './account/events';

// Goal domain exports
export * from './goal/aggregates/Goal';
export * from './goal/entities/KeyResult';
export * from './goal/entities/GoalRecord';
export * from './goal/entities/GoalReview';
export * from './goal/repositories/iGoalRepository';

// Task domain exports
export * from './task/aggregates/Task';

// Reminder domain exports
export * from './reminder/aggregates/Reminder';
