import { KeyResultCore } from '@dailyuse/domain-core';
import { GoalContracts } from '@dailyuse/contracts';

// 枚举别名
const KeyResultStatusEnum = GoalContracts.KeyResultStatus;

/**
 * 服务端 KeyResult 实体
 * 实现关键结果的服务端业务逻辑
 */
export class KeyResult extends KeyResultCore {
  constructor(params: {
    uuid?: string;
    goalUuid: string;
    name: string;
    description?: string;
    startValue?: number;
    targetValue: number;
    currentValue?: number;
    unit: string;
    weight?: number;
    calculationMethod?: GoalContracts.KeyResultCalculationMethod;
    status?: GoalContracts.KeyResultStatus;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params);
  }

  // ===== 服务端特有的进度计算方法 =====

  /**
   * 自定义进度计算逻辑（服务端实现）
   * 重写父类方法以实现服务端特定的业务逻辑
   */
  protected customProgressCalculation(): number {
    // 服务端可以访问更多数据来进行复杂的进度计算
    const baseProgress = this.progress;

    // 服务端特定逻辑：考虑历史数据、趋势分析等
    const trendFactor = this.calculateTrendFactor();
    const consistencyFactor = this.calculateConsistencyFactor();

    // 综合计算：基础进度 + 趋势调整 + 一致性调整
    const adjustedProgress = baseProgress * trendFactor * consistencyFactor;

    return Math.max(0, Math.min(100, adjustedProgress));
  }

  /**
   * 计算趋势因子（服务端特有）
   * 基于进度变化趋势调整
   */
  private calculateTrendFactor(): number {
    // 默认实现：基于创建时间和更新时间的变化率
    const now = Date.now();
    const created = this._lifecycle.createdAt.getTime();
    const updated = this._lifecycle.updatedAt.getTime();

    const totalTime = now - created;
    const activeTime = updated - created;

    if (totalTime === 0) return 1.0;

    const activityRatio = activeTime / totalTime;

    // 如果最近有活动，给予轻微加分
    return Math.min(1.1, 0.9 + activityRatio * 0.2);
  }

  /**
   * 计算一致性因子（服务端特有）
   * 基于进度更新的一致性
   */
  private calculateConsistencyFactor(): number {
    // 简化实现：基于当前值与目标值的合理性
    if (this._targetValue === 0) return 1.0;

    const progressRatio = this._currentValue / this._targetValue;

    // 如果进度过快或过慢，给予调整
    if (progressRatio > 1.2) return 0.95; // 进度过快，轻微调低
    if (progressRatio < 0.1) return 0.98; // 进度过慢，轻微调低

    return 1.0; // 正常情况
  }

  /**
   * 获取详细的进度分析（服务端专用）
   */
  getProgressAnalysis(): {
    baseProgress: number;
    calculatedProgress: number;
    trendFactor: number;
    consistencyFactor: number;
    recommendation: string;
  } {
    const baseProgress = this.progress;
    const trendFactor = this.calculateTrendFactor();
    const consistencyFactor = this.calculateConsistencyFactor();

    let recommendation = '进度正常';
    if (baseProgress < 30) {
      recommendation = '建议加快进度';
    } else if (baseProgress > 90) {
      recommendation = '即将完成，保持节奏';
    } else if (trendFactor < 0.95) {
      recommendation = '需要提高活跃度';
    }

    return {
      baseProgress,
      calculatedProgress: this.progress, // 使用基础的progress，避免循环引用
      trendFactor,
      consistencyFactor,
      recommendation,
    };
  }

  // ===== 业务方法 =====

  /**
   * 更新进度
   */
  updateProgress(value: number): void {
    if (this.lifecycle.status === 'archived') {
      throw new Error('已归档的关键结果不能更新进度');
    }

    const oldValue = this.currentValue;
    super.updateProgress(value, 'set');

    // 触发领域事件
    // this.addDomainEvent({
    //   eventType: 'KeyResultProgressUpdated',
    //   aggregateId: this.goalUuid,
    //   occurredOn: new Date(),
    //   payload: {
    //     accountUuid: this.accountUuid,
    //     goalUuid: this.goalUuid,
    //     keyResultUuid: this.uuid,
    //     oldValue,
    //     newValue: this.currentValue,
    //     isCompleted: this.isCompleted,
    //   },
    // });
  }

  /**
   * 增量更新进度
   */
  incrementProgress(increment: number): void {
    if (this.lifecycle.status === 'archived') {
      throw new Error('已归档的关键结果不能更新进度');
    }

    const oldValue = this.currentValue;
    super.updateProgress(increment, 'increment');

    // 触发领域事件
    // this.addDomainEvent({
    //   eventType: 'KeyResultProgressUpdated',
    //   aggregateId: this.goalUuid,
    //   occurredOn: new Date(),
    //   payload: {
    //     accountUuid: this.accountUuid,
    //     goalUuid: this.goalUuid,
    //     keyResultUuid: this.uuid,
    //     oldValue,
    //     newValue: this.currentValue,
    //     isCompleted: this.isCompleted,
    //   },
    // });
  }

  /**
   * 更新基本信息
   */
  updateInfo(params: {
    name?: string;
    description?: string;
    targetValue?: number;
    unit?: string;
    weight?: number;
    calculationMethod?: GoalContracts.KeyResultCalculationMethod;
  }): void {
    if (this.lifecycle.status === KeyResultStatusEnum.ARCHIVED) {
      throw new Error('已归档的关键结果不能修改');
    }

    super.updateInfo(params);
  }

  /**
   * 完成关键结果
   */
  complete(): void {
    if (this.lifecycle.status === 'completed') {
      throw new Error('关键结果已经完成');
    }
    if (this.lifecycle.status === 'archived') {
      throw new Error('已归档的关键结果不能完成');
    }

    // 使用父类的更新进度方法将当前值设为目标值
    super.updateProgress(this.targetValue, 'set');
  }

  /**
   * 归档关键结果
   */
  archive(): void {
    this._lifecycle.status = KeyResultStatusEnum.ARCHIVED;
    this._lifecycle.updatedAt = new Date();
  }

  /**
   * 重新激活关键结果
   */
  reactivate(): void {
    if (this.lifecycle.status !== 'archived') {
      throw new Error('只有已归档的关键结果才能重新激活');
    }

    this._lifecycle.status = KeyResultStatusEnum.ACTIVE;
    this._lifecycle.updatedAt = new Date();
  }

  // ===== 验证方法 =====
  validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('关键结果名称不能为空');
    }
    if (name.length > 200) {
      throw new Error('关键结果名称不能超过200个字符');
    }
  }

  validateTargetValue(value: number): void {
    if (value < 0) {
      throw new Error('目标值不能为负数');
    }
    if (value <= this.startValue) {
      throw new Error('目标值必须大于起始值');
    }
  }

  validateWeight(weight: number): void {
    if (weight < 0 || weight > 100) {
      throw new Error('权重必须在0-100之间');
    }
  }

  // ===== 序列化方法 =====
  static fromDTO(dto: GoalContracts.KeyResultDTO): KeyResult {
    return new KeyResult({
      uuid: dto.uuid,
      goalUuid: dto.goalUuid,
      name: dto.name,
      description: dto.description,
      startValue: dto.startValue,
      targetValue: dto.targetValue,
      currentValue: dto.currentValue,
      unit: dto.unit,
      weight: dto.weight,
      calculationMethod: dto.calculationMethod,
      status: dto.lifecycle.status,
      createdAt: new Date(dto.lifecycle.createdAt),
      updatedAt: new Date(dto.lifecycle.updatedAt),
    });
  }

  toResponse(): GoalContracts.KeyResultResponse {
    const dto = this.toDTO();

    return {
      ...dto,
      progress: this.progress,
      isCompleted: this.isCompleted,
      remaining: this.remaining,
    };
  }

  // ===== 数据库转换方法 =====

  /**
   * 转换为数据库 DTO（扁平化存储）
   */
  toDatabase(): any {
    return {
      uuid: this.uuid,
      goalUuid: this.goalUuid,
      // 基本信息
      name: this._name,
      description: this._description,
      unit: this._unit,
      weight: this._weight,
      // 数值信息
      startValue: this._startValue,
      targetValue: this._targetValue,
      currentValue: this._currentValue,
      // 计算配置
      calculationMethod: this._calculationMethod,
      // 生命周期
      createdAt: this._lifecycle.createdAt,
      updatedAt: this._lifecycle.updatedAt,
      status: this._lifecycle.status,
    };
  }

  /**
   * 从数据库 DTO 创建实例
   */
  static fromDatabase(dbData: any): KeyResult {
    return new KeyResult({
      uuid: dbData.uuid,
      goalUuid: dbData.goalUuid,
      name: dbData.name,
      description: dbData.description,
      startValue: dbData.startValue,
      targetValue: dbData.targetValue,
      currentValue: dbData.currentValue,
      unit: dbData.unit,
      weight: dbData.weight,
      calculationMethod: dbData.calculationMethod,
      status: dbData.status,
      createdAt: dbData.createdAt,
      updatedAt: dbData.updatedAt,
    });
  }
}
