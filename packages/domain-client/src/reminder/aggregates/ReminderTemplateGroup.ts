import { ReminderTemplateGroupCore } from '@dailyuse/domain-core';
import { ReminderContracts } from '@dailyuse/contracts';
import { ReminderTemplate } from './ReminderTemplate';

/**
 * 提醒模板分组聚合根 - 客户端实现
 * 继承核心 ReminderTemplateGroup 类，添加客户端特有功能
 */
export class ReminderTemplateGroup extends ReminderTemplateGroupCore {
  // 重新声明属性类型为具体的实体类型
  declare templates: ReminderTemplate[];

  constructor(params: {
    uuid?: string;
    name: string;
    description?: string;
    enabled?: boolean;
    enableMode: ReminderContracts.ReminderTemplateEnableMode;
    parentUuid?: string;
    icon?: string;
    color?: string;
    sortOrder?: number;
    createdAt?: Date;
    updatedAt?: Date;
    templates?: any[];
  }) {
    super(params);

    this.templates =
      params.templates?.map((tmpl) =>
        tmpl instanceof ReminderTemplate ? tmpl : ReminderTemplate.fromDTO(tmpl),
      ) || [];
  }

  // ===== 抽象方法实现 =====

  /**
   * 获取指定模板
   */
  getTemplate(templateUuid: string): ReminderTemplate | undefined {
    return this.templates.find((tmpl) => tmpl.uuid === templateUuid);
  }

  /**
   * 批量更新模板
   */
  batchUpdateTemplates(operation: 'enable' | 'disable' | 'delete', templateUuids: string[]): void {
    templateUuids.forEach((templateUuid) => {
      const template = this.getTemplate(templateUuid);
      if (template) {
        switch (operation) {
          case 'enable':
            // 调用模板的方法来启用
            break;
          case 'disable':
            // 调用模板的方法来禁用
            break;
          case 'delete':
            this.removeTemplate(templateUuid);
            break;
        }
      }
    });
    this.updateTimestamp();
  }

  /**
   * 克隆分组
   */
  clone(): ReminderTemplateGroup {
    return ReminderTemplateGroup.fromDTO(this.toDTO());
  }

  // ===== 客户端特有方法 =====

  /**
   * 添加模板到分组
   */
  addTemplate(template: ReminderTemplate): void {
    if (!this.templates.find((t) => t.uuid === template.uuid)) {
      this.templates.push(template);
      this.updateTimestamp();
    }
  }

  /**
   * 从分组中移除模板
   */
  removeTemplate(templateUuid: string): void {
    const index = this.templates.findIndex((t) => t.uuid === templateUuid);
    if (index !== -1) {
      this.templates.splice(index, 1);
      this.updateTimestamp();
    }
  }

  /**
   * 获取状态颜色（UI相关）
   */
  get statusColor(): string {
    if (!this.enabled) return '#9E9E9E';
    const enabledCount = this.templates.filter((t) => t.enabled).length;
    if (enabledCount === 0) return '#FF9800';
    return '#4CAF50';
  }

  /**
   * 获取状态文本
   */
  get statusText(): string {
    if (!this.enabled) return '已禁用';
    const enabledCount = this.templates.filter((t) => t.enabled).length;
    if (enabledCount === 0) return '无启用模板';
    return `${enabledCount}/${this.templates.length} 已启用`;
  }

  /**
   * 检查是否可以编辑
   */
  get canEdit(): boolean {
    return true;
  }

  /**
   * 检查是否可以删除
   */
  get canDelete(): boolean {
    return this.templates.length === 0; // 只有空分组才能删除
  }

  /**
   * 检查是否可以启用/禁用
   */
  get canToggleEnabled(): boolean {
    return true;
  }

  // ===== 序列化方法 =====

  static override fromDTO(dto: ReminderContracts.IReminderTemplateGroup): ReminderTemplateGroup {
    return new ReminderTemplateGroup({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description,
      enabled: dto.enabled,
      enableMode: dto.enableMode,
      parentUuid: dto.parentUuid,
      icon: dto.icon,
      color: dto.color,
      sortOrder: dto.sortOrder,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      templates: dto.templates,
    });
  }

  /**
   * 从 API 响应创建分组实例
   */
  static fromResponse(response: any): ReminderTemplateGroup {
    return new ReminderTemplateGroup({
      uuid: response.uuid,
      name: response.name,
      description: response.description,
      enabled: response.enabled,
      enableMode: response.enableMode,
      parentUuid: response.parentUuid,
      icon: response.icon,
      color: response.color,
      sortOrder: response.sortOrder,
      createdAt: response.createdAt ? new Date(response.createdAt) : new Date(),
      updatedAt: response.updatedAt ? new Date(response.updatedAt) : new Date(),
      templates: response.templates || [],
    });
  }

  /**
   * 创建一个空的分组实例（用于新建表单）
   */
  static forCreate(): ReminderTemplateGroup {
    return new ReminderTemplateGroup({
      name: '',
      enabled: true,
      enableMode: ReminderContracts.ReminderTemplateEnableMode.GROUP,
      sortOrder: 0,
      templates: [],
    });
  }
}
