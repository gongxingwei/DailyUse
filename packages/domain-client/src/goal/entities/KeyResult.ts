import { KeyResultCore } from '@dailyuse/domain-core';
import { GoalContracts } from '@dailyuse/contracts';

// 枚举别名
const KeyResultStatusEnum = GoalContracts.KeyResultStatus;

/**
 * 客户端 KeyResult 实体 - 关键结果实体
 * 符合 IKeyResultClient 接口定义，包含计算属性
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

  // ===== 序列化方法 =====
  toDTO(): GoalContracts.KeyResultDTO {
    return {
      uuid: this.uuid,
      goalUuid: this._goalUuid,
      name: this._name,
      description: this._description,
      startValue: this._startValue,
      targetValue: this._targetValue,
      currentValue: this._currentValue,
      unit: this._unit,
      weight: this._weight,
      calculationMethod: this._calculationMethod,
      lifecycle: {
        createdAt: this._lifecycle.createdAt.getTime(),
        updatedAt: this._lifecycle.updatedAt.getTime(),
        status: this._lifecycle.status,
      },
    };
  }

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

  /**
   * 克隆当前对象（深拷贝）
   * 用于表单编辑时避免直接修改原数据
   */
  clone(): KeyResult {
    return KeyResult.fromDTO(this.toDTO());
  }

  static forCreate(params: {
    accountUuid: string;
    goalUuid: string;
    unit: string;
    name?: string;
    targetValue?: number;
    weight?: number;
  }): KeyResult {
    return new KeyResult({
      goalUuid: params.goalUuid,
      name: params.name || '',
      targetValue: params.targetValue || 10,
      unit: params.unit,
      weight: params.weight || 10,
    });
  }

  // ===== 客户端特有的进度计算方法 =====

  /**
   * 自定义进度计算逻辑（客户端实现）
   * 重写父类方法以实现客户端特定的业务逻辑
   */
  protected customProgressCalculation(): number {
    // 客户端可以实现更复杂的进度计算逻辑
    const baseProgress = this.progress;

    // 客户端特定逻辑：考虑用户活跃度等因素
    const activityFactor = this.getActivityFactor();

    // 综合计算：主要基于基础进度，活跃度作为调节因子
    const adjustedProgress = baseProgress * (activityFactor / 100);

    return Math.max(0, Math.min(100, adjustedProgress));
  }

  /**
   * 获取活跃度因子（客户端特有）
   * 基于用户最近的更新频率计算
   */
  private getActivityFactor(): number {
    const now = Date.now();
    const lastUpdate = this._lifecycle.updatedAt.getTime();
    const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);

    // 如果最近3天内有更新，给予加分
    if (daysSinceUpdate <= 3) return 110; // 轻微加分
    if (daysSinceUpdate <= 7) return 100; // 正常
    if (daysSinceUpdate <= 14) return 95; // 轻微减分
    return 90; // 减分但不过度惩罚
  }

  /**
   * 获取进度颜色（UI相关）
   */
  get progressColor(): string {
    // 使用基础的progress属性，如果calculatedProgress不可用
    const progress = this.progress;
    if (progress >= 100) return 'success';
    if (progress >= 80) return 'warning';
    if (progress >= 60) return 'info';
    if (progress >= 40) return 'primary';
    return 'error';
  }

  /**
   * 获取进度图标（UI相关）
   */
  get progressIcon(): string {
    const progress = this.progress;
    if (progress === 0) return 'mdi-play-circle-outline';
    if (progress >= 100) return 'mdi-check-circle';
    if (progress >= 80) return 'mdi-check-circle-outline';
    return 'mdi-progress-clock';
  }

  // ===== 计算属性 =====

  /**
   * 进度百分比 (0-100)
   */
  get progress(): number {
    const range = this._targetValue - this._startValue;
    if (range === 0) return 100;

    const current = this._currentValue - this._startValue;
    return Math.min(100, Math.max(0, Math.round((current / range) * 100)));
  }

  /**
   * 是否已完成
   */
  get isCompleted(): boolean {
    return this._currentValue >= this._targetValue;
  }

  /**
   * 剩余数量
   */
  get remaining(): number {
    return Math.max(0, this._targetValue - this._currentValue);
  }

  // ===== 抽象方法实现=====
  complete(): void {
    this._lifecycle.status = KeyResultStatusEnum.COMPLETED;
  }

  archive(): void {
    this._lifecycle.status = KeyResultStatusEnum.ARCHIVED;
  }

  reactivate(): void {
    this._lifecycle.status = KeyResultStatusEnum.ACTIVE;
  }
}
