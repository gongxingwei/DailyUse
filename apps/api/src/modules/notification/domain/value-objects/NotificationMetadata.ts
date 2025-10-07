/**
 * NotificationMetadata 值对象
 *
 * 封装通知的元数据信息（来源、追溯信息）
 * 不可变，通过值判断相等性
 */
export class NotificationMetadata {
  private constructor(
    public readonly sourceType: string,
    public readonly sourceId: string,
    public readonly additionalData?: Record<string, any>,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.sourceType || this.sourceType.trim().length === 0) {
      throw new Error('Source type cannot be empty');
    }

    if (!this.sourceId || this.sourceId.trim().length === 0) {
      throw new Error('Source id cannot be empty');
    }

    // 验证 sourceType 是否为已知类型
    const validSourceTypes = ['goal', 'task', 'reminder', 'schedule', 'system', 'user', 'custom'];
    if (!validSourceTypes.includes(this.sourceType)) {
      console.warn(`Unknown source type: ${this.sourceType}`);
    }
  }

  static create(params: {
    sourceType: string;
    sourceId: string;
    additionalData?: Record<string, any>;
  }): NotificationMetadata {
    return new NotificationMetadata(
      params.sourceType.trim(),
      params.sourceId.trim(),
      params.additionalData,
    );
  }

  /**
   * 创建目标相关的元数据
   */
  static createForGoal(params: {
    goalId: string;
    additionalData?: Record<string, any>;
  }): NotificationMetadata {
    return new NotificationMetadata('goal', params.goalId, params.additionalData);
  }

  /**
   * 创建任务相关的元数据
   */
  static createForTask(params: {
    taskId: string;
    additionalData?: Record<string, any>;
  }): NotificationMetadata {
    return new NotificationMetadata('task', params.taskId, params.additionalData);
  }

  /**
   * 创建提醒相关的元数据
   */
  static createForReminder(params: {
    reminderId: string;
    additionalData?: Record<string, any>;
  }): NotificationMetadata {
    return new NotificationMetadata('reminder', params.reminderId, params.additionalData);
  }

  /**
   * 创建调度任务相关的元数据
   */
  static createForSchedule(params: {
    scheduleId: string;
    additionalData?: Record<string, any>;
  }): NotificationMetadata {
    return new NotificationMetadata('schedule', params.scheduleId, params.additionalData);
  }

  /**
   * 创建系统通知的元数据
   */
  static createForSystem(params: {
    systemId: string;
    additionalData?: Record<string, any>;
  }): NotificationMetadata {
    return new NotificationMetadata('system', params.systemId, params.additionalData);
  }

  /**
   * 获取指定的附加数据
   */
  getAdditionalData<T = any>(key: string): T | undefined {
    return this.additionalData?.[key] as T | undefined;
  }

  /**
   * 检查是否有附加数据
   */
  hasAdditionalData(): boolean {
    return this.additionalData !== undefined && Object.keys(this.additionalData).length > 0;
  }

  /**
   * 值对象相等性比较
   */
  equals(other: NotificationMetadata): boolean {
    return (
      this.sourceType === other.sourceType &&
      this.sourceId === other.sourceId &&
      JSON.stringify(this.additionalData) === JSON.stringify(other.additionalData)
    );
  }

  /**
   * 转换为普通对象
   */
  toPlainObject() {
    return {
      sourceType: this.sourceType,
      sourceId: this.sourceId,
      additionalData: this.additionalData,
    };
  }
}
