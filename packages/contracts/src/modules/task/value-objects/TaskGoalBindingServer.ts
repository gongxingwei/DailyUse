/**
 * TaskGoalBinding Value Object - Server Interface
 * 任务目标绑定值对象 - 服务端接口
 */

import type { TaskGoalBindingClientDTO } from './TaskGoalBindingClient';

// ============ 接口定义 ============

export interface TaskGoalBindingServer {
  goalUuid: string;
  keyResultUuid: string;
  incrementValue: number;

  equals(other: TaskGoalBindingServer): boolean;
  toServerDTO(): TaskGoalBindingServerDTO;
  toClientDTO(): TaskGoalBindingClientDTO;
  toPersistenceDTO(): TaskGoalBindingPersistenceDTO;
}

// ============ DTO 定义 ============

export interface TaskGoalBindingServerDTO {
  goalUuid: string;
  keyResultUuid: string;
  incrementValue: number;
}

export interface TaskGoalBindingPersistenceDTO {
  goal_uuid: string;
  key_result_uuid: string;
  increment_value: number;
}
