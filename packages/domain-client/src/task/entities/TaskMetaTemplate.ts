import { TaskTemplateCore, TaskInstanceCore, TaskMetaTemplateCore } from '@dailyuse/domain-core';
import type { TaskContracts } from '@dailyuse/contracts';

/**
 * 任务元模板客户端实现 - 添加客户端特有功能
 */
export class TaskMetaTemplateClient extends TaskMetaTemplateCore {
  /**
   * 从 DTO 创建客户端任务元模板
   */
  static fromDTO(dto: TaskContracts.TaskMetaTemplateDTO): TaskMetaTemplateClient {
    const metaTemplate = new TaskMetaTemplateClient({
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
    return this._name.length > 30 ? `${this._name.substring(0, 27)}...` : this._name;
  }

  /**
   * 获取分类显示文本
   */
  get categoryText(): string {
    return this._appearance.category || '未分类';
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
  clone(): TaskMetaTemplateClient {
    return TaskMetaTemplateClient.fromDTO(this.toDTO());
  }
}
