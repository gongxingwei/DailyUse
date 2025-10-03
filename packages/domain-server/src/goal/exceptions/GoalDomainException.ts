/**
 * Goal 领域异常类
 * 使用统一的错误代码而非语言文本
 */
import { GoalContracts } from '@dailyuse/contracts';

export class GoalDomainException extends Error {
  constructor(
    public readonly code: GoalContracts.GoalErrorCode,
    message?: string,
  ) {
    super(message || code);
    this.name = 'GoalDomainException';
  }

  /**
   * 判断是否为特定错误代码
   */
  is(code: GoalContracts.GoalErrorCode): boolean {
    return this.code === code;
  }

  /**
   * 判断是否为 NOT_FOUND 类型的错误
   */
  isNotFound(): boolean {
    return (
      this.code === GoalContracts.GoalErrorCode.GOAL_NOT_FOUND ||
      this.code === GoalContracts.GoalErrorCode.KEY_RESULT_NOT_FOUND ||
      this.code === GoalContracts.GoalErrorCode.GOAL_RECORD_NOT_FOUND ||
      this.code === GoalContracts.GoalErrorCode.GOAL_REVIEW_NOT_FOUND ||
      this.code === GoalContracts.GoalErrorCode.GOAL_DIR_NOT_FOUND
    );
  }
}
