import { Entity } from '@dailyuse/utils';

export class GoalRecord extends Entity {
  private _goalUuid: string;
  private _keyResultUuid: string;
  private _value: number;
  private _note?: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(params: {
    uuid?: string;
    goalUuid: string;
    keyResultUuid: string;
    value: number;
    note?: string;
  }) {
    super(params.uuid);
    this._goalUuid = params.goalUuid;
    this._keyResultUuid = params.keyResultUuid;
    this._value = params.value;
    this._note = params.note;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get goalUuid(): string {
    return this._goalUuid;
  }

  get keyResultUuid(): string {
    return this._keyResultUuid;
  }

  get value(): number {
    return this._value;
  }

  get note(): string | undefined {
    return this._note;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get lifecycle() {
    return {
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  updateValue(value: number): void {
    this._value = value;
    this._updatedAt = new Date();
  }

  updateNote(note: string): void {
    this._note = note;
    this._updatedAt = new Date();
  }
}
