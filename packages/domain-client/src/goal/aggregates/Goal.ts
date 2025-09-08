import { GoalCore, GoalDirCore } from '@dailyuse/domain-core';
import { type GoalContracts, type IGoal, type IGoalDir } from '@dailyuse/contracts';

/**
 * 客户端 Goal 实体
 * 继承核心 Goal 类，添加客户端特有功能
 */
export class Goal extends GoalCore {
  constructor(params: {
    uuid?: string;
    name: string;
    description?: string;
    color: string;
    dirUuid?: string;
    startTime?: Date;
    endTime?: Date;
    note?: string;
    motive?: string;
    feasibility?: string;
    status?: 'active' | 'completed' | 'paused' | 'archived';
    createdAt?: Date;
    updatedAt?: Date;
    keyResults?: any[];
    records?: any[];
    reviews?: any[];
    version?: number;
  }) {
    super(params);
  }

  // ===== 客户端特有方法 =====

  /**
   * 暂停目标
   */
  pause(): void {
    if (this._lifecycle.status === 'completed') {
      throw new Error('已完成的目标不能暂停');
    }
    if (this._lifecycle.status === 'archived') {
      throw new Error('已归档的目标不能暂停');
    }

    this._lifecycle.status = 'paused';
    this.updateVersion();
  }

  /**
   * 激活目标
   */
  activate(): void {
    if (this._lifecycle.status === 'completed') {
      throw new Error('已完成的目标不能重新激活');
    }

    this._lifecycle.status = 'active';
    this.updateVersion();
  }

  /**
   * 完成目标
   */
  complete(): void {
    if (this._lifecycle.status === 'completed') {
      throw new Error('目标已经完成');
    }
    if (this._lifecycle.status === 'archived') {
      throw new Error('已归档的目标不能完成');
    }

    this._lifecycle.status = 'completed';
    this.updateVersion();
  }

  /**
   * 归档目标
   */
  archive(): void {
    this._lifecycle.status = 'archived';
    this.updateVersion();
  }

  // ===== 客户端特有计算属性 =====

  /**
   * 获取显示状态文本
   */
  get statusText(): string {
    const statusMap = {
      active: '进行中',
      paused: '已暂停',
      completed: '已完成',
      archived: '已归档',
    };
    return statusMap[this._lifecycle.status] || '未知';
  }

  /**
   * 获取状态颜色
   */
  get statusColor(): string {
    const colorMap = {
      active: '#4CAF50',
      paused: '#FF9800',
      completed: '#2196F3',
      archived: '#9E9E9E',
    };
    return colorMap[this._lifecycle.status] || '#9E9E9E';
  }

  /**
   * 获取进度百分比文本
   */
  get progressText(): string {
    return `${Math.round(this.overallProgress)}%`;
  }

  /**
   * 获取剩余时间文本
   */
  get timeRemainingText(): string {
    if (this.isOverdue) {
      return `已逾期 ${Math.abs(this.daysRemaining)} 天`;
    }

    if (this.daysRemaining === 0) {
      return '今天截止';
    }

    return `还有 ${this.daysRemaining} 天`;
  }

  /**
   * 是否可以编辑
   */
  get canEdit(): boolean {
    return this._lifecycle.status === 'active' || this._lifecycle.status === 'paused';
  }

  /**
   * 是否可以完成
   */
  get canComplete(): boolean {
    return this._lifecycle.status === 'active' || this._lifecycle.status === 'paused';
  }

  /**
   * 是否可以暂停
   */
  get canPause(): boolean {
    return this._lifecycle.status === 'active';
  }

  /**
   * 是否可以恢复
   */
  get canResume(): boolean {
    return this._lifecycle.status === 'paused';
  }

  /**
   * 是否可以归档
   */
  get canArchive(): boolean {
    return this._lifecycle.status === 'completed' || this._lifecycle.status === 'paused';
  }

  /**
   * 获取关键结果摘要
   */
  get keyResultsSummary(): string {
    if (this.totalKeyResults === 0) {
      return '暂无关键结果';
    }

    return `${this.completedKeyResults}/${this.totalKeyResults} 已完成`;
  }

  // ===== 客户端特有方法 =====

  /**
   * 获取格式化的时间范围
   */
  getFormattedTimeRange(): string {
    const startStr = this._startTime.toLocaleDateString();
    const endStr = this._endTime.toLocaleDateString();
    return `${startStr} ~ ${endStr}`;
  }

  /**
   * 获取创建时间的相对时间
   */
  getRelativeCreatedTime(): string {
    const now = new Date();
    const diffMs = now.getTime() - this._lifecycle.createdAt.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天创建';
    } else if (diffDays === 1) {
      return '昨天创建';
    } else if (diffDays < 7) {
      return `${diffDays} 天前创建`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} 周前创建`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} 个月前创建`;
    }
  }

  /**
   * 检查是否需要关注（即将截止或进度滞后）
   */
  needsAttention(): boolean {
    // 还有3天截止但进度不足80%
    if (this.daysRemaining <= 3 && this.overallProgress < 80) {
      return true;
    }

    // 已逾期
    if (this.isOverdue) {
      return true;
    }

    // 已暂停超过7天
    if (this._lifecycle.status === 'paused') {
      const pausedDays = Math.floor(
        (new Date().getTime() - this._lifecycle.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (pausedDays > 7) {
        return true;
      }
    }

    return false;
  }

  /**
   * 获取注意事项文本
   */
  getAttentionText(): string {
    if (this.isOverdue) {
      return '目标已逾期，请及时处理';
    }

    if (this.daysRemaining <= 3 && this.overallProgress < 80) {
      return '即将截止但进度滞后，请加快推进';
    }

    if (this._lifecycle.status === 'paused') {
      const pausedDays = Math.floor(
        (new Date().getTime() - this._lifecycle.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (pausedDays > 7) {
        return `目标已暂停 ${pausedDays} 天，建议恢复或调整`;
      }
    }

    return '';
  }

  /**
   * 检查是否可以执行某个操作（UI权限控制）
   */
  canPerformAction(action: 'edit' | 'pause' | 'resume' | 'complete' | 'archive'): boolean {
    switch (action) {
      case 'edit':
        return this.canEdit;
      case 'pause':
        return this.canPause;
      case 'resume':
        return this.canResume;
      case 'complete':
        return this.canComplete;
      case 'archive':
        return this.canArchive;
      default:
        return false;
    }
  }

  /**
   * 获取可用的操作列表（用于上下文菜单）
   */
  getAvailableActions(): Array<{
    key: string;
    label: string;
    icon?: string;
    disabled?: boolean;
  }> {
    const actions = [
      {
        key: 'edit',
        label: '编辑',
        icon: 'edit',
        disabled: !this.canPerformAction('edit'),
      },
      {
        key: 'pause',
        label: '暂停',
        icon: 'pause',
        disabled: !this.canPerformAction('pause'),
      },
      {
        key: 'resume',
        label: '恢复',
        icon: 'play',
        disabled: !this.canPerformAction('resume'),
      },
      {
        key: 'complete',
        label: '完成',
        icon: 'check',
        disabled: !this.canPerformAction('complete'),
      },
      {
        key: 'archive',
        label: '归档',
        icon: 'archive',
        disabled: !this.canPerformAction('archive'),
      },
    ];

    return actions.filter((action) => !action.disabled);
  }

  // ===== 客户端数据转换方法 =====

  /**
   * 转换为表单数据（用于编辑表单）
   */
  toFormData(): {
    name: string;
    description: string;
    color: string;
    dirUuid: string;
    startTime: string;
    endTime: string;
    note: string;
    motive: string;
    feasibility: string;
  } {
    return {
      name: this._name,
      description: this._description || '',
      color: this._color,
      dirUuid: this._dirUuid || '',
      startTime: this._startTime.toISOString().split('T')[0],
      endTime: this._endTime.toISOString().split('T')[0],
      note: this._note || '',
      motive: this._analysis.motive || '',
      feasibility: this._analysis.feasibility || '',
    };
  }

  // ===== 序列化方法 =====

  static fromDTO(dto: GoalContracts.GoalDTO): Goal {
    return new Goal({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description,
      color: dto.color,
      dirUuid: dto.dirUuid,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      note: dto.note,
      motive: dto.analysis.motive,
      feasibility: dto.analysis.feasibility,
      status: dto.lifecycle.status,
      createdAt: new Date(dto.lifecycle.createdAt),
      updatedAt: new Date(dto.lifecycle.updatedAt),
      version: dto.version,
    });
  }

  static fromResponse(response: GoalContracts.GoalResponse): Goal {
    const goal = Goal.fromDTO(response);

    // 设置关键结果
    goal.keyResults = response.keyResults.map((kr) => ({
      uuid: kr.uuid,
      name: kr.name,
      description: kr.description,
      startValue: kr.startValue,
      targetValue: kr.targetValue,
      currentValue: kr.currentValue,
      unit: kr.unit,
      weight: kr.weight,
      calculationMethod: kr.calculationMethod,
      createdAt: new Date(kr.createdAt),
      updatedAt: new Date(kr.updatedAt),
      status: kr.status,
    }));

    // 设置记录
    goal.records = response.records.map((record) => ({
      uuid: record.uuid,
      goalUuid: record.goalUuid,
      keyResultUuid: record.keyResultUuid,
      value: record.value,
      note: record.note,
      recordDate: new Date(record.recordDate),
      createdAt: new Date(record.createdAt),
    }));

    // 设置复盘
    goal.reviews = response.reviews.map((review) => ({
      uuid: review.uuid,
      goalUuid: review.goalUuid,
      title: review.title,
      type: review.type,
      reviewDate: new Date(review.reviewDate),
      content: review.content,
      snapshot: {
        ...review.snapshot,
        snapshotDate: new Date(review.snapshot.snapshotDate),
      },
      rating: review.rating,
      createdAt: new Date(review.createdAt),
      updatedAt: new Date(review.updatedAt),
    }));

    return goal;
  }

  /**
   * 创建一个空的目标实例（用于新建表单）
   */
  static forCreate(): Goal {
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30天后

    return new Goal({
      name: '',
      color: '#FF5733',
      startTime: now,
      endTime: endDate,
    });
  }

  /**
   * 客户端缓存键
   */
  getCacheKey(): string {
    return `goal_${this.uuid}`;
  }

  /**
   * 检查是否需要刷新（基于更新时间）
   */
  shouldRefresh(): boolean {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this._lifecycle.updatedAt < fiveMinutesAgo;
  }
}

/**
 * 客户端 GoalDir 实体
 * 继承核心 GoalDir 类，添加客户端特有功能
 */
export class GoalDir extends GoalDirCore {
  constructor(params: {
    uuid?: string;
    name: string;
    description?: string;
    icon: string;
    color: string;
    parentUuid?: string;
    sortConfig?: {
      sortKey: string;
      sortOrder: number;
    };
    status?: 'active' | 'archived';
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super(params);
  }

  // ===== 客户端特有方法 =====

  /**
   * 归档目录
   */
  archive(): void {
    this._lifecycle.status = 'archived';
    this._lifecycle.updatedAt = new Date();
  }

  /**
   * 激活目录
   */
  activate(): void {
    this._lifecycle.status = 'active';
    this._lifecycle.updatedAt = new Date();
  }

  // ===== 客户端特有计算属性 =====

  /**
   * 是否为系统目录
   */
  get isSystemDir(): boolean {
    return this.uuid.startsWith('system_');
  }

  /**
   * 是否可以编辑
   */
  get canEdit(): boolean {
    return !this.isSystemDir && this._lifecycle.status === 'active';
  }

  /**
   * 是否可以删除
   */
  get canDelete(): boolean {
    return !this.isSystemDir && this._lifecycle.status === 'archived';
  }

  /**
   * 获取显示图标
   */
  get displayIcon(): string {
    return this._icon || 'mdi-folder';
  }

  /**
   * 获取显示颜色
   */
  get displayColor(): string {
    return this._color || '#2196F3';
  }

  /**
   * 获取状态文本
   */
  get statusText(): string {
    return this._lifecycle.status === 'active' ? '活跃' : '已归档';
  }

  /**
   * 转换为表单数据（用于编辑表单）
   */
  toFormData(): {
    name: string;
    description: string;
    icon: string;
    color: string;
    parentUuid: string;
  } {
    return {
      name: this._name,
      description: this._description || '',
      icon: this._icon,
      color: this._color,
      parentUuid: this._parentUuid || '',
    };
  }

  // ===== 序列化方法 =====

  static fromDTO(dto: GoalContracts.GoalDirDTO): GoalDir {
    return new GoalDir({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      color: dto.color,
      parentUuid: dto.parentUuid,
      sortConfig: dto.sortConfig,
      status: dto.lifecycle.status,
      createdAt: new Date(dto.lifecycle.createdAt),
      updatedAt: new Date(dto.lifecycle.updatedAt),
    });
  }

  static fromResponse(response: GoalContracts.GoalDirResponse): GoalDir {
    return GoalDir.fromDTO(response);
  }

  /**
   * 创建一个空的目录实例（用于新建表单）
   */
  static forCreate(): GoalDir {
    return new GoalDir({
      name: '',
      icon: 'mdi-folder',
      color: '#2196F3',
    });
  }
}
