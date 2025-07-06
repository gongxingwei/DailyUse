// Re-export domain types for presentation layer
export type {
  IGoal,
  IKeyResult,
  IRecord,
  IGoalDir,
  IGoalCreateDTO,
  IKeyResultCreateDTO,
  IRecordCreateDTO,
  IGoalDirCreateDTO,
  KeyResultLink
} from '../../domain/types/goal';

import type {
  IGoal,
  IKeyResult,
  IRecord,
  IGoalDir
} from '../../domain/types/goal';

// Additional presentation-specific types
export interface IRecordCreate {
  value: number;
  date: string;
  note?: string;
}

// Legacy type compatibility (may be removed later)
export type KeyResult = IKeyResult;
export type Goal = IGoal;
export type Record = IRecord;
export type GoalDir = IGoalDir;
