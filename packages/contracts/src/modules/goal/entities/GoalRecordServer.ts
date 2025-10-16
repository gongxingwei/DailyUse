/**
 * GoalRecord Entity - Server Interface
 * 目标记录实体 - 服务端接口
 */

// ============ DTO 定义 ============

/**
 * GoalRecord Server DTO
 */
export interface GoalRecordServerDTO {
  uuid: string;
  keyResultUuid: string;
  goalUuid: string;
  previousValue: number;
  newValue: number;
  changeAmount: number;
  note?: string | null;
  recordedAt: number;
  createdAt: number;
}

/**
 * GoalRecord Persistence DTO
 */
export interface GoalRecordPersistenceDTO {
  uuid: string;
  key_result_uuid: string;
  goal_uuid: string;
  previous_value: number;
  new_value: number;
  change_amount: number;
  note?: string | null;
  recorded_at: number;
  created_at: number;
}

// ============ 实体接口 ============

export interface GoalRecordServer {
  uuid: string;
  keyResultUuid: string;
  goalUuid: string;
  previousValue: number;
  newValue: number;
  changeAmount: number;
  note?: string | null;
  recordedAt: number;
  createdAt: number;

  getChangePercentage(): number;
  isPositiveChange(): boolean;
  updateNote(note: string): void;

  toServerDTO(): GoalRecordServerDTO;
  toClientDTO(): GoalRecordClientDTO;
  toPersistenceDTO(): GoalRecordPersistenceDTO;
}

export interface GoalRecordServerStatic {
  create(params: {
    keyResultUuid: string;
    goalUuid: string;
    previousValue: number;
    newValue: number;
    note?: string;
    recordedAt?: number;
  }): GoalRecordServer;
  fromServerDTO(dto: GoalRecordServerDTO): GoalRecordServer;
  fromPersistenceDTO(dto: GoalRecordPersistenceDTO): GoalRecordServer;
}
