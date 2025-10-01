// Authentication domain client exports
export * from './authentication';

// Account domain client exports
export * from './account';

// Goal domain client exports
export * from './goal';

// Explicit re-export to resolve GoalReview ambiguity
export { GoalReview } from './goal';

// Task domain client exports
export * from './task';

// Repository domain client exports
export { Repository } from './repository';
export { Resource as RepositoryResource } from './repository';

// Editor domain client exports
export * from './editor';

// Reminder domain client exports
export * from './reminder';

// Schedule domain client exports
export * from './schedule';


