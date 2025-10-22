/**
 * KR 权重快照相关错误类
 */

import { DomainError } from '@dailyuse/utils';

/**
 * 无效权重错误
 * 
 * 当权重值不在 0-100 范围内时抛出
 */
export class InvalidWeightError extends DomainError {
  constructor(field: 'oldWeight' | 'newWeight', value: number) {
    super(
      'INVALID_WEIGHT',
      `Invalid ${field}: ${value}. Weight must be between 0 and 100`,
      { field, value },
      400
    );
  }
}

/**
 * KeyResult 未找到错误
 * 
 * 当尝试为不存在的 KeyResult 创建快照时抛出
 */
export class KeyResultNotFoundInGoalError extends DomainError {
  constructor(krUuid: string, goalUuid: string) {
    super(
      'KEY_RESULT_NOT_FOUND_IN_GOAL',
      `KeyResult ${krUuid} not found in Goal ${goalUuid}`,
      { krUuid, goalUuid },
      404
    );
  }
}
