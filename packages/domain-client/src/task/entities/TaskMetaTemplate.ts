import { TaskMetaTemplateCore } from '@dailyuse/domain-core';
import type { TaskContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';
import type { TaskTemplate } from '../aggregates/TaskTemplate';

/**
 * 任务元模板实体 - 客户端实现
 * 提供预定义的任务模板样式和默认配置
 */
export class TaskMetaTemplate extends TaskMetaTemplateCore {
  /**
   * 从 DTO 创建客户端任务元模板
   */
  static fromDTO(dto: TaskContracts.TaskMetaTemplateDTO): TaskMetaTemplate {
    const metaTemplate = new TaskMetaTemplate({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      appearance: dto.appearance,
      defaultTimeConfig: dto.defaultTimeConfig,
      defaultReminderConfig: dto.defaultReminderConfig,
      defaultProperties: dto.defaultProperties,
      createdAt: new Date(dto.lifecycle.createdAt),
    });

    // 恢复状态
    (metaTemplate as any)._usage = {
      usageCount: dto.usage.usageCount,
      lastUsedAt: dto.usage.lastUsedAt ? new Date(dto.usage.lastUsedAt) : undefined,
      isFavorite: dto.usage.isFavorite,
    };

    (metaTemplate as any)._lifecycle = {
      createdAt: new Date(dto.lifecycle.createdAt),
      updatedAt: new Date(dto.lifecycle.updatedAt),
      isActive: dto.lifecycle.isActive,
    };

    return metaTemplate;
  }

  // ===== 客户端特有的计算属性 =====

  /**
   * 获取显示名称（限制长度）
   */
  get displayName(): string {
    return this.name.length > 30 ? `${this.name.substring(0, 27)}...` : this.name;
  }

  /**
   * 获取分类显示文本
   */
  get categoryText(): string {
    const categoryMap: Record<string, string> = {
      work: '工作',
      personal: '个人',
      health: '健康',
      education: '学习',
      finance: '财务',
      household: '家务',
      social: '社交',
      entertainment: '娱乐',
      shopping: '购物',
      travel: '旅行',
      other: '其他',
    };
    return categoryMap[this.appearance.category] || this.appearance.category;
  }

  /**
   * 获取图标颜色（带透明度）
   */
  get iconColorWithOpacity(): string {
    return `${this.appearance.color}20`; // 添加20%透明度
  }

  /**
   * 获取优先级文本
   */
  get priorityText(): string {
    const priorityMap = {
      [ImportanceLevel.Vital]: '极其重要',
      [ImportanceLevel.Important]: '非常重要',
      [ImportanceLevel.Moderate]: '中等重要',
      [ImportanceLevel.Minor]: '不太重要',
      [ImportanceLevel.Trivial]: '无关紧要',
    };
    return priorityMap[this.defaultProperties.importance] || '中等重要';
  }

  /**
   * 获取紧急程度文本
   */
  get urgencyText(): string {
    const urgencyMap = {
      [UrgencyLevel.Critical]: '非常紧急',
      [UrgencyLevel.High]: '高度紧急',
      [UrgencyLevel.Medium]: '中等紧急',
      [UrgencyLevel.Low]: '低度紧急',
      [UrgencyLevel.None]: '无期限',
    };
    return urgencyMap[this.defaultProperties.urgency] || '中等紧急';
  }

  /**
   * 获取时间类型文本
   */
  get timeTypeText(): string {
    const typeMap = {
      allDay: '全天',
      specificTime: '指定时间',
      timeRange: '时间范围',
    };
    return typeMap[this.defaultTimeConfig.timeType] || '全天';
  }

  /**
   * 获取调度模式文本
   */
  get scheduleModeText(): string {
    const modeMap = {
      once: '单次',
      daily: '每日',
      weekly: '每周',
      monthly: '每月',
      intervalDays: `间隔天数`,
    };
    return modeMap[this.defaultTimeConfig.scheduleMode] || '单次';
  }

  /**
   * 是否为热门模板（使用次数 > 5）
   */
  get isPopular(): boolean {
    return this.usage.usageCount > 5;
  }

  /**
   * 是否为最近使用（7天内）
   */
  get isRecentlyUsed(): boolean {
    if (!this.usage.lastUsedAt) return false;
    const daysDiff = (Date.now() - this.usage.lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  }

  /**
   * 获取使用频率标签
   */
  get usageFrequencyLabel(): string {
    const count = this.usage.usageCount;
    if (count === 0) return '未使用';
    if (count <= 2) return '偶尔使用';
    if (count <= 5) return '经常使用';
    if (count <= 10) return '频繁使用';
    return '高频使用';
  }

  /**
   * 获取使用频率颜色
   */
  get usageFrequencyColor(): string {
    const count = this.usage.usageCount;
    if (count === 0) return '#9E9E9E';
    if (count <= 2) return '#FFC107';
    if (count <= 5) return '#FF9800';
    if (count <= 10) return '#FF5722';
    return '#F44336';
  }

  // ===== 客户端特有的业务方法 =====

  /**
   * 获取基于此元模板的任务模板配置
   */
  getTaskTemplateConfig(overrides?: {
    title?: string;
    description?: string;
    timeConfig?: Partial<any>;
    reminderConfig?: Partial<any>;
    properties?: Partial<any>;
  }): any {
    // 返回创建任务模板所需的数据结构
    return {
      title: overrides?.title || `基于${this.name}的任务`,
      description: overrides?.description || this.description,
      timeConfig: {
        ...this.defaultTimeConfig,
        ...overrides?.timeConfig,
      },
      reminderConfig: {
        ...this.defaultReminderConfig,
        ...overrides?.reminderConfig,
      },
      properties: {
        ...this.defaultProperties,
        ...overrides?.properties,
      },
      metaTemplateUuid: this.uuid,
    };
  }

  /**
   * 获取推荐的标签
   */
  getRecommendedTags(): string[] {
    const categoryTags: Record<string, string[]> = {
      work: ['工作', '项目', '会议', '报告'],
      personal: ['个人', '生活', '家庭'],
      health: ['健康', '运动', '医疗', '锻炼'],
      education: ['学习', '读书', '课程', '培训'],
      finance: ['财务', '账单', '投资', '理财'],
      household: ['家务', '清洁', '购物', '维修'],
      social: ['社交', '聚会', '约会', '联系'],
      entertainment: ['娱乐', '电影', '游戏', '休闲'],
      shopping: ['购物', '采购', '买菜'],
      travel: ['旅行', '出行', '预订', '行程'],
      other: ['其他', '杂项'],
    };

    return categoryTags[this.appearance.category] || categoryTags.other;
  }

  /**
   * 获取推荐的提醒时间
   */
  getRecommendedReminderTimes(): string[] {
    const categoryTimes: Record<string, string[]> = {
      work: ['09:00', '14:00', '17:00'],
      personal: ['08:00', '12:00', '19:00'],
      health: ['07:00', '12:00', '18:00'],
      education: ['09:00', '14:00', '20:00'],
      finance: ['10:00', '15:00'],
      household: ['09:00', '15:00'],
      social: ['10:00', '16:00', '19:00'],
      entertainment: ['19:00', '20:00'],
      shopping: ['10:00', '15:00'],
      travel: ['08:00', '10:00', '16:00'],
      other: ['09:00', '14:00', '18:00'],
    };

    return categoryTimes[this.appearance.category] || categoryTimes.other;
  }

  /**
   * 标记为收藏
   */
  markAsFavorite(): void {
    this.toggleFavorite();
  }

  /**
   * 取消收藏
   */
  unmarkAsFavorite(): void {
    if (this.usage.isFavorite) {
      this.toggleFavorite();
    }
  }

  /**
   * 记录使用（客户端调用）
   */
  recordUsage(): void {
    this.incrementUsage();
  }

  /**
   * 获取相似的元模板建议（基于分类和属性）
   */
  getSimilarityScore(other: TaskMetaTemplate): number {
    let score = 0;

    // 分类匹配 (40分)
    if (this.appearance.category === other.appearance.category) {
      score += 40;
    }

    // 优先级匹配 (20分)
    if (this.defaultProperties.importance === other.defaultProperties.importance) {
      score += 20;
    }

    // 紧急程度匹配 (20分)
    if (this.defaultProperties.urgency === other.defaultProperties.urgency) {
      score += 20;
    }

    // 时间类型匹配 (10分)
    if (this.defaultTimeConfig.timeType === other.defaultTimeConfig.timeType) {
      score += 10;
    }

    // 调度模式匹配 (10分)
    if (this.defaultTimeConfig.scheduleMode === other.defaultTimeConfig.scheduleMode) {
      score += 10;
    }

    return score;
  }

  /**
   * 转换为表单数据（用于编辑）
   */
  toFormData(): any {
    return {
      name: this.name,
      description: this.description,
      category: this.appearance.category,
      icon: this.appearance.icon,
      color: this.appearance.color,
      timeType: this.defaultTimeConfig.timeType,
      startTime: this.defaultTimeConfig.commonTimeSettings?.startTime,
      endTime: this.defaultTimeConfig.commonTimeSettings?.endTime,
      scheduleMode: this.defaultTimeConfig.scheduleMode,
      reminderEnabled: this.defaultReminderConfig.enabled,
      reminderMinutes: this.defaultReminderConfig.minutesBefore,
      reminderMethods: [...this.defaultReminderConfig.methods],
      importance: this.defaultProperties.importance,
      urgency: this.defaultProperties.urgency,
      location: this.defaultProperties.location,
      tags: [...this.defaultProperties.tags],
    };
  }

  /**
   * 从表单数据更新（客户端使用）
   */
  updateFromFormData(formData: any): void {
    this.updateName(formData.name);

    this.updateAppearance({
      category: formData.category,
      icon: formData.icon,
      color: formData.color,
    });

    // 使用父类提供的方法更新数据
    // 注意：这里应该调用父类的方法，但由于父类方法可能不存在，我们直接设置属性
    (this._defaultTimeConfig as any) = {
      ...this._defaultTimeConfig,
      timeType: formData.timeType,
      scheduleMode: formData.scheduleMode,
      commonTimeSettings: {
        startTime: formData.startTime,
        endTime: formData.endTime,
      },
    };

    (this._defaultReminderConfig as any) = {
      ...this._defaultReminderConfig,
      enabled: formData.reminderEnabled,
      minutesBefore: formData.reminderMinutes,
      methods: formData.reminderMethods,
    };

    (this._defaultProperties as any) = {
      ...this._defaultProperties,
      importance: formData.importance,
      urgency: formData.urgency,
      location: formData.location,
      tags: formData.tags,
    };
  }

  /**
   * 获取使用频率显示文本
   */
  get usageText(): string {
    const count = (this as any)._usage.usageCount;
    if (count === 0) return '未使用';
    if (count < 5) return '偶尔使用';
    if (count < 20) return '经常使用';
    return '频繁使用';
  }

  /**
   * 获取状态显示文本
   */
  get statusText(): string {
    return (this as any)._lifecycle.isActive ? '启用' : '禁用';
  }

  /**
   * 获取状态颜色
   */
  get statusColor(): string {
    return (this as any)._lifecycle.isActive ? '#4CAF50' : '#9E9E9E';
  }

  // ===== 实现抽象方法 =====
  use(): void {
    (this as any)._usage.usageCount++;
    (this as any)._usage.lastUsedAt = new Date();
    this.updateVersion();
  }

  toggleFavorite(): void {
    (this as any)._usage.isFavorite = !(this as any)._usage.isFavorite;
    this.updateVersion();
  }

  activate(): void {
    (this as any)._lifecycle.isActive = true;
    this.updateVersion();
  }

  deactivate(): void {
    (this as any)._lifecycle.isActive = false;
    this.updateVersion();
  }

  updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('元模板名称不能为空');
    }
    this._name = newName;
    this.updateVersion();
  }

  updateAppearance(newAppearance: any): void {
    this._appearance = { ...this._appearance, ...newAppearance };
    this.updateVersion();
  }

  /**
   * 转换为 DTO
   */
  toDTO(): TaskContracts.TaskMetaTemplateDTO {
    const usage = (this as any)._usage;
    const lifecycle = (this as any)._lifecycle;

    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      appearance: {
        icon: this._appearance.icon,
        color: this._appearance.color,
        category: this._appearance.category,
      },
      defaultTimeConfig: {
        timeType: this._defaultTimeConfig.timeType,
        scheduleMode: this._defaultTimeConfig.scheduleMode,
        timezone: this._defaultTimeConfig.timezone,
        commonTimeSettings: this._defaultTimeConfig.commonTimeSettings
          ? {
              startTime: this._defaultTimeConfig.commonTimeSettings.startTime,
              endTime: this._defaultTimeConfig.commonTimeSettings.endTime,
            }
          : undefined,
      },
      defaultReminderConfig: {
        enabled: this._defaultReminderConfig.enabled,
        minutesBefore: this._defaultReminderConfig.minutesBefore,
        methods: [...this._defaultReminderConfig.methods],
      },
      defaultProperties: {
        importance: this._defaultProperties.importance,
        urgency: this._defaultProperties.urgency,
        tags: [...this._defaultProperties.tags],
        location: this._defaultProperties.location,
      },
      usage: {
        usageCount: usage.usageCount,
        lastUsedAt: usage.lastUsedAt?.toISOString(),
        isFavorite: usage.isFavorite,
      },
      lifecycle: {
        createdAt: lifecycle.createdAt.toISOString(),
        updatedAt: lifecycle.updatedAt.toISOString(),
        isActive: lifecycle.isActive,
      },
    };
  }

  /**
   * 克隆当前对象（深拷贝）
   * 用于表单编辑时避免直接修改原数据
   */
  clone(): TaskMetaTemplate {
    return TaskMetaTemplate.fromDTO(this.toDTO());
  }
}
