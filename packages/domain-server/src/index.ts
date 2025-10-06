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
export * from './goal/repositories/IGoalAggregateRepository';
export * from './goal/repositories/IGoalDirRepository';
export * from './goal/services/UserDataInitializationService';
export * from './goal/exceptions/GoalDomainException';

// Task domain exports
// TaskStats 不是真正的聚合根，只是读模型，已合并到 TaskTemplate 仓储中
export * from './task/aggregates/TaskTemplate';
export * from './task/aggregates/TaskMetaTemplate';
export * from './task/entities/TaskInstance';
export * from './task/repositories/ITaskTemplateAggregateRepository';
export * from './task/repositories/ITaskMetaTemplateAggregateRepository';
export * from './task/exceptions/TaskDomainException';

// Reminder domain exports
export * from './reminder/aggregates/Reminder';
export * from './reminder/aggregates/ReminderTemplate';
export * from './reminder/aggregates/ReminderTemplateGroup';
export * from './reminder/entities/ReminderInstance';
export * from './reminder/repositories/IReminderAggregateRepository';
export * from './reminder/repositories/IReminderTemplateAggregateRepository';
export * from './reminder/repositories/IReminderTemplateGroupAggregateRepository';

// Repository domain exports
export * from './repository';

// Editor domain exports
export * from './editor';

// Setting domain exports
export * from './setting/aggregates/SettingDefinition';

// Schedule domain exports
export * from './schedule';

// Theme domain exports
export * from './theme';
