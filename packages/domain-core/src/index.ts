// Authentication domain exports
export * from './authentication/aggregates/AuthCredentialCore';
export * from './authentication/entities/MFADeviceCore';
export * from './authentication/entities/SessionCore';
export * from './authentication/valueObjects/PasswordCore';
export * from './authentication/valueObjects/TokenCore';

// Account domain exports
export * from './account/aggregates/AccountCore';
export * from './account/entities/UserCore';
export * from './account/entities/RoleCore';
export * from './account/entities/PermissionCore';
export * from './account/valueObjects/EmailCore';
export * from './account/valueObjects/PhoneNumberCore';
export * from './account/valueObjects/AddressCore';
export * from './account/valueObjects/SexCore';

// Goal domain exports
export * from './goal/aggregates/Goal';
export * from './goal/aggregates/GoalDir';
export * from './goal/entities/KeyResult';
export * from './goal/entities/GoalRecord';
export * from './goal/entities/GoalReview';

// Task domain exports
export * from './task/aggregates/TaskTemplate';
export * from './task/entities/TaskInstance';
export * from './task/aggregates/TaskMetaTemplate';

// Task Schedule Integration
export {
  TaskScheduleIntegrationService,
  type TaskReminderConfig,
} from './task/services/TaskScheduleIntegrationService';

// Repository domain exports
export * from './repository/aggregates/RepositoryCore';
export * from './repository/entities/Resource';

// Editor domain exports
export * from './editor/aggregates/EditorCore';

// Reminder domain exports
export * from './reminder';

// Setting domain exports
export * from './setting/SettingCore';
export * from './setting/aggregates';

// Schedule domain exports
export * from './schedule';

// Theme domain exports
export * from './theme';

// Notification domain exports
// export * from './notification/NotificationCore';

// Domain Events
export * from './events';
