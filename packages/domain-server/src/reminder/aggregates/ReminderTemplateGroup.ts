import { ReminderTemplateGroupCore } from '@dailyuse/domain-core';
import { ReminderContracts } from '@dailyuse/contracts';
import { ReminderTemplate } from './ReminderTemplate';

type ReminderTemplateClientDTO = ReminderContracts.ReminderTemplateClientDTO;

/**
 * 提醒模板分组聚合根 - 服务端实现
 * 继承核心 ReminderTemplateGroup 类，添加服务端特有功能
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
            template.toggleEnabled(true);
            break;
          case 'disable':
            template.toggleEnabled(false);
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

  // ===== 服务端特有方法 =====

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
   * 启用所有模板
   */
  enableAllTemplates(): void {
    this.templates.forEach((template) => {
      template.toggleEnabled(true);
    });
    this.updateTimestamp();
  }

  /**
   * 禁用所有模板
   */
  disableAllTemplates(): void {
    this.templates.forEach((template) => {
      template.toggleEnabled(false);
    });
    this.updateTimestamp();
  }

  /**
   * 根据条件过滤模板
   */
  filterTemplates(criteria: {
    enabled?: boolean;
    category?: string;
    tags?: string[];
    priority?: ReminderContracts.ReminderPriority;
  }): ReminderTemplate[] {
    return this.templates.filter((template) => {
      if (criteria.enabled !== undefined && template.enabled !== criteria.enabled) {
        return false;
      }
      if (criteria.category && template.category !== criteria.category) {
        return false;
      }
      if (criteria.tags && !criteria.tags.every((tag) => template.tags.includes(tag))) {
        return false;
      }
      if (criteria.priority && template.priority !== criteria.priority) {
        return false;
      }
      return true;
    });
  }

  /**
   * 获取分组统计信息
   */
  getStatistics(): {
    totalTemplates: number;
    enabledTemplates: number;
    disabledTemplates: number;
    totalInstances: number;
    activeInstances: number;
    completedInstances: number;
  } {
    const totalTemplates = this.templates.length;
    const enabledTemplates = this.templates.filter((t) => t.enabled).length;
    const disabledTemplates = totalTemplates - enabledTemplates;

    // TODO: instances 已从 ReminderTemplate 移除，需要从其他地方获取实例统计
    const totalInstances = 0;
    const activeInstances = 0;
    const completedInstances = 0;

    return {
      totalTemplates,
      enabledTemplates,
      disabledTemplates,
      totalInstances,
      activeInstances,
      completedInstances,
    };
  }

  /**
   * 导出分组配置（用于备份和迁移）
   */
  exportConfiguration(): {
    group: ReminderContracts.IReminderTemplateGroup;
    templates: ReminderContracts.IReminderTemplate[];
  } {
    return {
      group: this.toDTO(),
      templates: this.templates.map((t) => t.toDTO()),
    };
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
   * 从导入的配置创建分组
   */
  static fromImportedConfiguration(config: {
    group: ReminderContracts.IReminderTemplateGroup;
    templates: ReminderContracts.IReminderTemplate[];
  }): ReminderTemplateGroup {
    const group = ReminderTemplateGroup.fromDTO(config.group);
    group.templates = config.templates.map((dto) => ReminderTemplate.fromDTO(dto));
    return group;
  }

  /**
   * 从持久化数据重建聚合根
   */
  static fromPersistence(data: any): ReminderTemplateGroup {
    return new ReminderTemplateGroup({
      uuid: data.uuid,
      name: data.name,
      description: data.description,
      enabled: data.enabled,
      enableMode: data.enableMode,
      parentUuid: data.parentUuid,
      icon: data.icon,
      color: data.color,
      sortOrder: data.sortOrder,
      createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt),
      // templates 在查询时单独加载
      templates: [],
    });
  }

  /**
   * 转换为持久化数据
   */
  toPersistence(accountUuid: string) {
    return {
      uuid: this._uuid,
      accountUuid,
      name: this._name,
      description: this._description,
      enabled: this._enabled,
      enableMode: this._enableMode,
      parentUuid: this._parentUuid,
      icon: this._icon,
      color: this._color,
      sortOrder: this._sortOrder,
      createdAt: this._lifecycle.createdAt,
      updatedAt: this._lifecycle.updatedAt,
    };
  }

  /**
   * 转换为客户端 DTO（包含计算属性）
   */
  toClient(): any {
    const baseDTO = this.toDTO();
    const stats = this.getStatistics();

    return {
      uuid: baseDTO.uuid,
      name: baseDTO.name,
      description: baseDTO.description,
      enabled: baseDTO.enabled,
      enableMode: baseDTO.enableMode,
      parentUuid: baseDTO.parentUuid,
      icon: baseDTO.icon,
      color: baseDTO.color,
      sortOrder: baseDTO.sortOrder,
      createdAt: baseDTO.createdAt.getTime(),
      updatedAt: baseDTO.updatedAt.getTime(),
      // 子实体
      templates: this.templates.map((t) => t.toClient()),
      // 计算属性
      displayName: `${baseDTO.name} (${stats.totalTemplates})`,
      templateCount: stats.totalTemplates,
      enabledTemplateCount: stats.enabledTemplates,
      totalInstanceCount: stats.totalInstances,
      activeInstanceCount: stats.activeInstances,
      completedInstanceCount: stats.completedInstances,
      canEdit: true,
      canDelete: stats.totalTemplates === 0,
      canReorder: true,
      statusText: baseDTO.enabled ? '已启用' : '已禁用',
      statusColor: baseDTO.enabled ? '#4CAF50' : '#9E9E9E',
    };
  }
}
