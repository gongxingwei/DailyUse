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
export * from './goal/aggregates/GoalDir';
export * from './goal/entities/KeyResult';
export * from './goal/entities/GoalRecord';
export * from './goal/entities/GoalReview';
export * from './goal/repositories/iGoalRepository';
export * from './goal/services/UserDataInitializationService';
export * from './goal/exceptions/GoalDomainException';

// Task domain exports
export * from './task/aggregates/TaskTemplate';
export * from './task/entities/TaskInstance';
export * from './task/entities/TaskMetaTemplate';
export * from './task/repositories/iTaskRepository';

// Reminder domain exports
export * from './reminder/aggregates/Reminder';
export * from './reminder/aggregates/ReminderTemplate';
export * from './reminder/aggregates/ReminderTemplateGroup';
export * from './reminder/entities/ReminderInstance';
export * from './reminder/repositories/IReminderAggregateRepository';
export * from './reminder/services/ReminderAggregateService';

// Repository domain exports
export * from './repository';

// Editor domain exports
export * from './editor';

// Setting domain exports
export * from './setting/aggregates/SettingDefinition';

// Schedule domain exports
export * from './schedule';
