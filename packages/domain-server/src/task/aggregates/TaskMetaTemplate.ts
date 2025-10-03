import { TaskMetaTemplateCore } from '@dailyuse/domain-core';
import type { TaskContracts } from '@dailyuse/contracts';
import type { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

/**
 * 任务元模板聚合根 - 服务端实现
 */
export class TaskMetaTemplate extends TaskMetaTemplateCore {
  /**
   * 从 DTO 创建任务元模板实例
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
    metaTemplate._usage = {
      usageCount: dto.usage.usageCount,
      lastUsedAt: dto.usage.lastUsedAt ? new Date(dto.usage.lastUsedAt) : undefined,
      isFavorite: dto.usage.isFavorite,
    };

    metaTemplate._lifecycle = {
      createdAt: new Date(dto.lifecycle.createdAt),
      updatedAt: new Date(dto.lifecycle.updatedAt),
      isActive: dto.lifecycle.isActive,
    };

    return metaTemplate;
  }

  /**
   * 创建新的任务元模板
   */
  static create(params: {
    accountUuid: string;
    name: string;
    description?: string;
    appearance: {
      icon?: string;
      color?: string;
      category: string;
    };
    defaultTimeConfig: {
      timeType: TaskContracts.TaskTimeType;
      scheduleMode: TaskContracts.TaskScheduleMode;
      timezone: string;
      commonTimeSettings?: {
        startTime?: string;
        endTime?: string;
      };
    };
    defaultReminderConfig?: {
      enabled: boolean;
      minutesBefore: number;
      methods: ('notification' | 'sound')[];
    };
    defaultProperties?: {
      importance: ImportanceLevel;
      urgency: UrgencyLevel;
      tags: string[];
      location?: string;
    };
  }): TaskMetaTemplate {
    const metaTemplate = new TaskMetaTemplate(params);

    return metaTemplate;
  }

  /**
   * 使用元模板创建任务模板
   */
  use(): void {
    this.incrementUsage();
  }

  /**
   * 切换收藏状态
   */
  toggleFavorite(): void {
    this._usage.isFavorite = !this._usage.isFavorite;
    this.updateVersion();
  }

  /**
   * 激活元模板
   */
  activate(): void {
    if (this._lifecycle.isActive) {
      return; // 已经激活
    }

    this._lifecycle.isActive = true;
    this.updateVersion();
  }

  /**
   * 停用元模板
   */
  deactivate(): void {
    if (!this._lifecycle.isActive) {
      return; // 已经停用
    }

    this._lifecycle.isActive = false;
    this.updateVersion();
  }

  /**
   * 更新名称
   */
  updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('元模板名称不能为空');
    }

    const oldName = this._name;
    this._name = newName;
    this.updateVersion();
  }

  /**
   * 更新外观设置
   */
  updateAppearance(newAppearance: { icon?: string; color?: string; category?: string }): void {
    const oldAppearance = { ...this._appearance };
    this._appearance = { ...this._appearance, ...newAppearance };
    this.updateVersion();
  }

  /**
   * 转换为 DTO
   */
  toDTO(): TaskContracts.TaskMetaTemplateDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      appearance: this._appearance,
      defaultTimeConfig: this._defaultTimeConfig,
      defaultReminderConfig: this._defaultReminderConfig,
      defaultProperties: this._defaultProperties,
      usage: {
        usageCount: this._usage.usageCount,
        lastUsedAt: this._usage.lastUsedAt?.toISOString(),
        isFavorite: this._usage.isFavorite,
      },
      lifecycle: {
        createdAt: this._lifecycle.createdAt.toISOString(),
        updatedAt: this._lifecycle.updatedAt.toISOString(),
        isActive: this._lifecycle.isActive,
      },
    };
  }
}
