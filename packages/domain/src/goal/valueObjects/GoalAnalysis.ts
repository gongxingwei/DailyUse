import { ValueObject } from '@dailyuse/utils';

interface GoalAnalysisProps {
  motive: string;
  feasibility: string;
}

export class GoalAnalysis extends ValueObject {
  private readonly _motive: string;
  private readonly _feasibility: string;

  get motive(): string {
    return this._motive;
  }

  get feasibility(): string {
    return this._feasibility;
  }

  private constructor(props: GoalAnalysisProps) {
    super();
    this._motive = props.motive;
    this._feasibility = props.feasibility;
  }

  public static create(props: GoalAnalysisProps): GoalAnalysis | null {
    if (!props.motive || props.motive.trim().length === 0) {
      throw new Error('Goal motive cannot be empty');
    }

    if (!props.feasibility || props.feasibility.trim().length === 0) {
      throw new Error('Goal feasibility cannot be empty');
    }

    if (props.motive.length > 1000) {
      throw new Error('Goal motive cannot exceed 1000 characters');
    }

    if (props.feasibility.length > 1000) {
      throw new Error('Goal feasibility cannot exceed 1000 characters');
    }

    return new GoalAnalysis({
      motive: props.motive.trim(),
      feasibility: props.feasibility.trim(),
    });
  }

  equals(other: ValueObject): boolean {
    if (!(other instanceof GoalAnalysis)) {
      return false;
    }
    return this._motive === other._motive && this._feasibility === other._feasibility;
  }
}
