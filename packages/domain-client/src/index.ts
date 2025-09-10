// Authentication domain client exports
export * from './authentication';

// Account domain client exports
export * from './account';

// Goal domain client exports
export * from './goal';

// Explicit re-export to resolve GoalReview ambiguity
export { GoalReview } from './goal';
