/**
 * Task 领域异常类
 * 用于表示 Task 模块的业务规则违反
 */

export enum TaskErrorCode {
  // 任务模板错误
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  TEMPLATE_ALREADY_EXISTS = 'TEMPLATE_ALREADY_EXISTS',
  TEMPLATE_INVALID_STATUS = 'TEMPLATE_INVALID_STATUS',
  TEMPLATE_CANNOT_ACTIVATE = 'TEMPLATE_CANNOT_ACTIVATE',
  TEMPLATE_CANNOT_PAUSE = 'TEMPLATE_CANNOT_PAUSE',
  TEMPLATE_CANNOT_COMPLETE = 'TEMPLATE_CANNOT_COMPLETE',
  TEMPLATE_CANNOT_ARCHIVE = 'TEMPLATE_CANNOT_ARCHIVE',

  // 任务实例错误
  INSTANCE_NOT_FOUND = 'INSTANCE_NOT_FOUND',
  INSTANCE_ALREADY_COMPLETED = 'INSTANCE_ALREADY_COMPLETED',
  INSTANCE_ALREADY_CANCELLED = 'INSTANCE_ALREADY_CANCELLED',
  INSTANCE_CANNOT_START = 'INSTANCE_CANNOT_START',
  INSTANCE_CANNOT_COMPLETE = 'INSTANCE_CANNOT_COMPLETE',
  INSTANCE_CANNOT_CANCEL = 'INSTANCE_CANNOT_CANCEL',
  INSTANCE_CANNOT_RESCHEDULE = 'INSTANCE_CANNOT_RESCHEDULE',
  INSTANCE_CANNOT_DELETE = 'INSTANCE_CANNOT_DELETE',

  // 时间配置错误
  INVALID_TIME_CONFIG = 'INVALID_TIME_CONFIG',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  INVALID_SCHEDULE_MODE = 'INVALID_SCHEDULE_MODE',
  PAST_DATE_NOT_ALLOWED = 'PAST_DATE_NOT_ALLOWED',

  // 提醒配置错误
  INVALID_REMINDER_CONFIG = 'INVALID_REMINDER_CONFIG',
  REMINDER_NOT_ENABLED = 'REMINDER_NOT_ENABLED',
  REMINDER_ALREADY_TRIGGERED = 'REMINDER_ALREADY_TRIGGERED',

  // 权限错误
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // 验证错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_FIELD_VALUE = 'INVALID_FIELD_VALUE',

  // 业务规则错误
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INVALID_OPERATION = 'INVALID_OPERATION',

  // 元模板错误
  META_TEMPLATE_NOT_FOUND = 'META_TEMPLATE_NOT_FOUND',
  META_TEMPLATE_IN_USE = 'META_TEMPLATE_IN_USE',

  // 其他错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class TaskDomainException extends Error {
  public readonly code: TaskErrorCode;
  public readonly details?: any;

  constructor(code: TaskErrorCode, message?: string, details?: any) {
    super(message || TaskDomainException.getDefaultMessage(code));
    this.name = 'TaskDomainException';
    this.code = code;
    this.details = details;

    // 维护正确的原型链
    Object.setPrototypeOf(this, TaskDomainException.prototype);
  }

  /**
   * 获取错误代码的默认消息
   */
  private static getDefaultMessage(code: TaskErrorCode): string {
    const messages: Record<TaskErrorCode, string> = {
      // 任务模板错误
      [TaskErrorCode.TEMPLATE_NOT_FOUND]: '任务模板不存在',
      [TaskErrorCode.TEMPLATE_ALREADY_EXISTS]: '任务模板已存在',
      [TaskErrorCode.TEMPLATE_INVALID_STATUS]: '无效的任务模板状态',
      [TaskErrorCode.TEMPLATE_CANNOT_ACTIVATE]: '无法激活任务模板',
      [TaskErrorCode.TEMPLATE_CANNOT_PAUSE]: '无法暂停任务模板',
      [TaskErrorCode.TEMPLATE_CANNOT_COMPLETE]: '无法完成任务模板',
      [TaskErrorCode.TEMPLATE_CANNOT_ARCHIVE]: '无法归档任务模板',

      // 任务实例错误
      [TaskErrorCode.INSTANCE_NOT_FOUND]: '任务实例不存在',
      [TaskErrorCode.INSTANCE_ALREADY_COMPLETED]: '任务实例已完成',
      [TaskErrorCode.INSTANCE_ALREADY_CANCELLED]: '任务实例已取消',
      [TaskErrorCode.INSTANCE_CANNOT_START]: '无法开始任务实例',
      [TaskErrorCode.INSTANCE_CANNOT_COMPLETE]: '无法完成任务实例',
      [TaskErrorCode.INSTANCE_CANNOT_CANCEL]: '无法取消任务实例',
      [TaskErrorCode.INSTANCE_CANNOT_RESCHEDULE]: '无法重新调度任务实例',
      [TaskErrorCode.INSTANCE_CANNOT_DELETE]: '无法删除任务实例',

      // 时间配置错误
      [TaskErrorCode.INVALID_TIME_CONFIG]: '无效的时间配置',
      [TaskErrorCode.INVALID_DATE_RANGE]: '无效的日期范围',
      [TaskErrorCode.INVALID_SCHEDULE_MODE]: '无效的调度模式',
      [TaskErrorCode.PAST_DATE_NOT_ALLOWED]: '不允许使用过去的日期',

      // 提醒配置错误
      [TaskErrorCode.INVALID_REMINDER_CONFIG]: '无效的提醒配置',
      [TaskErrorCode.REMINDER_NOT_ENABLED]: '提醒未启用',
      [TaskErrorCode.REMINDER_ALREADY_TRIGGERED]: '提醒已触发',

      // 权限错误
      [TaskErrorCode.UNAUTHORIZED]: '未授权',
      [TaskErrorCode.FORBIDDEN]: '禁止访问',

      // 验证错误
      [TaskErrorCode.VALIDATION_ERROR]: '验证失败',
      [TaskErrorCode.REQUIRED_FIELD_MISSING]: '必填字段缺失',
      [TaskErrorCode.INVALID_FIELD_VALUE]: '无效的字段值',

      // 业务规则错误
      [TaskErrorCode.BUSINESS_RULE_VIOLATION]: '违反业务规则',
      [TaskErrorCode.INVALID_OPERATION]: '无效的操作',

      // 元模板错误
      [TaskErrorCode.META_TEMPLATE_NOT_FOUND]: '任务元模板不存在',
      [TaskErrorCode.META_TEMPLATE_IN_USE]: '任务元模板正在使用中',

      // 其他错误
      [TaskErrorCode.UNKNOWN_ERROR]: '未知错误',
    };

    return messages[code] || '未知错误';
  }

  /**
   * 转换为 JSON 格式
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }

  /**
   * 静态工厂方法 - 任务模板不存在
   */
  static templateNotFound(templateUuid: string): TaskDomainException {
    return new TaskDomainException(
      TaskErrorCode.TEMPLATE_NOT_FOUND,
      `任务模板不存在: ${templateUuid}`,
      { templateUuid },
    );
  }

  /**
   * 静态工厂方法 - 任务实例不存在
   */
  static instanceNotFound(instanceUuid: string): TaskDomainException {
    return new TaskDomainException(
      TaskErrorCode.INSTANCE_NOT_FOUND,
      `任务实例不存在: ${instanceUuid}`,
      { instanceUuid },
    );
  }

  /**
   * 静态工厂方法 - 无效的状态转换
   */
  static invalidStatusTransition(from: string, to: string): TaskDomainException {
    return new TaskDomainException(
      TaskErrorCode.TEMPLATE_INVALID_STATUS,
      `无效的状态转换: 从 ${from} 到 ${to}`,
      { from, to },
    );
  }

  /**
   * 静态工厂方法 - 过去的日期不允许
   */
  static pastDateNotAllowed(date: Date): TaskDomainException {
    return new TaskDomainException(
      TaskErrorCode.PAST_DATE_NOT_ALLOWED,
      `不能使用过去的日期: ${date.toISOString()}`,
      { date: date.toISOString() },
    );
  }

  /**
   * 静态工厂方法 - 验证错误
   */
  static validationError(field: string, message: string): TaskDomainException {
    return new TaskDomainException(
      TaskErrorCode.VALIDATION_ERROR,
      `字段 ${field} 验证失败: ${message}`,
      { field, validationMessage: message },
    );
  }

  /**
   * 静态工厂方法 - 业务规则违反
   */
  static businessRuleViolation(rule: string, details?: any): TaskDomainException {
    return new TaskDomainException(
      TaskErrorCode.BUSINESS_RULE_VIOLATION,
      `违反业务规则: ${rule}`,
      details,
    );
  }
}
