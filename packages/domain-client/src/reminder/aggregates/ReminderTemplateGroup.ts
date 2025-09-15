import type { ReminderContracts } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import { ReminderTemplate } from './ReminderTemplate';

/**
 * 提醒模板分组聚合根 - 客户端实现
 * 管理一组ReminderTemplate的集合和启用状态
 */
export class ReminderTemplateGroup extends AggregateRoot {
  protected _uuid: string;
  protected _name: string;
  protected _description?: string;
  protected _enabled: boolean;
  protected _enableMode: ReminderContracts.ReminderTemplateEnableMode;
  protected _parentUuid?: string;
  protected _icon?: string;
  protected _color?: string;
  protected _sortOrder: number;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  // 聚合根关联的模板
  public templates: ReminderTemplate[] = [];

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
    templates?: ReminderTemplate[] | any[]; // 支持实体形式或DTO形式
  }) {
    const uuid = params.uuid || AggregateRoot.generateUUID();
    super(uuid);

    this._uuid = uuid;
    this._name = params.name;
    this._description = params.description;
    this._enabled = params.enabled ?? true;
    this._enableMode = params.enableMode;
    this._parentUuid = params.parentUuid;
    this._icon = params.icon;
    this._color = params.color;
    this._sortOrder = params.sortOrder || 0;
    this._createdAt = params.createdAt || new Date();
    this._updatedAt = params.updatedAt || new Date();

    // 支持DTO形式和实体形式的ReminderTemplate数组
    // 使用instanceof判断，参考Goal模块的实现
    this.templates =
      params.templates?.map((template) => {
        if (template instanceof ReminderTemplate) {
          return template;
        } else {
          // 不是实体则调用fromDTO方法
          return ReminderTemplate.fromDTO(template);
        }
      }) || [];
  }

  // ===== DDD聚合根控制模式 - 业务方法 =====

  /**
   * 添加模板到组中（聚合根控制）
   */
  addTemplate(template: ReminderTemplate): void {
    // 业务规则验证
    if (this.templates.some((t) => t.uuid === template.uuid)) {
      throw new Error('模板已存在于该组中');
    }

    this.templates.push(template);
    this.updateTimestamp();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'ReminderTemplateAddedToGroup',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        groupUuid: this._uuid,
        templateUuid: template.uuid,
        templateName: template.name,
      },
    });
  }

  /**
   * 从组中移除模板（聚合根控制）
   */
  removeTemplate(templateUuid: string): void {
    const templateIndex = this.templates.findIndex((t) => t.uuid === templateUuid);
    if (templateIndex === -1) {
      throw new Error('模板不存在于该组中');
    }

    const template = this.templates[templateIndex];
    this.templates.splice(templateIndex, 1);
    this.updateTimestamp();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'ReminderTemplateRemovedFromGroup',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        groupUuid: this._uuid,
        templateUuid,
        templateName: template.name,
      },
    });
  }

  /**
   * 启用/禁用整个组（聚合根控制）
   */
  toggleEnabled(enabled: boolean): void {
    if (this._enabled === enabled) {
      return;
    }

    this._enabled = enabled;
    this.updateTimestamp();

    // 根据启用模式处理组内模板
    if (this._enableMode === 'group') {
      // 组模式：组的启用状态影响所有模板
      this.templates.forEach((template) => {
        template.toggleEnabled(enabled);
      });
    }

    // 发布领域事件
    this.addDomainEvent({
      eventType: enabled ? 'ReminderGroupEnabled' : 'ReminderGroupDisabled',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        groupUuid: this._uuid,
        enableMode: this._enableMode,
        affectedTemplatesCount: this._enableMode === 'group' ? this.templates.length : 0,
      },
    });
  }

  /**
   * 更新组的启用模式
   */
  updateEnableMode(enableMode: ReminderContracts.ReminderTemplateEnableMode): void {
    if (this._enableMode === enableMode) {
      return;
    }

    const oldMode = this._enableMode;
    this._enableMode = enableMode;
    this.updateTimestamp();

    // 如果切换到组模式，同步所有模板的启用状态
    if (enableMode === 'group') {
      this.templates.forEach((template) => {
        template.toggleEnabled(this._enabled);
      });
    }

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'ReminderGroupEnableModeChanged',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        groupUuid: this._uuid,
        oldMode,
        newMode: enableMode,
        templatesAffected: enableMode === 'group',
      },
    });
  }

  /**
   * 批量操作组内模板
   */
  batchUpdateTemplates(operation: 'enable' | 'disable' | 'delete', templateUuids: string[]): void {
    const affectedTemplates: { uuid: string; name: string }[] = [];

    templateUuids.forEach((templateUuid) => {
      const template = this.templates.find((t) => t.uuid === templateUuid);
      if (!template) {
        return;
      }

      affectedTemplates.push({ uuid: template.uuid, name: template.name });

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
    });

    this.updateTimestamp();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'ReminderTemplatesBatchUpdated',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      payload: {
        groupUuid: this._uuid,
        operation,
        affectedTemplates,
        affectedCount: affectedTemplates.length,
      },
    });
  }

  // ===== 业务规则和计算 =====

  /**
   * 获取有效的（启用的）模板数量
   */
  get activeTemplateCount(): number {
    return this.templates.filter((template) => template.enabled).length;
  }

  /**
   * 获取模板总数
   */
  get templateCount(): number {
    return this.templates.length;
  }

  /**
   * 检查组是否有效（至少有一个启用的模板）
   */
  get isEffective(): boolean {
    return this._enabled && this.activeTemplateCount > 0;
  }

  /**
   * 获取组的层级深度（通过parentUuid计算）
   */
  get depth(): number {
    // 这里简化处理，实际应该通过递归查找parent链计算
    return this._parentUuid ? 1 : 0;
  }

  /**
   * 更新时间戳
   */
  private updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  // ===== 序列化方法 =====

  toDTO(): ReminderContracts.IReminderTemplateGroup {
    return {
      uuid: this._uuid,
      name: this._name,
      description: this._description,
      enabled: this._enabled,
      enableMode: this._enableMode,
      templates: this.templates.map((template) => template.toDTO()),
      parentUuid: this._parentUuid,
      icon: this._icon,
      color: this._color,
      sortOrder: this._sortOrder,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  static fromDTO(dto: ReminderContracts.IReminderTemplateGroup): ReminderTemplateGroup {
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
      templates: dto.templates || [],
    });
  }

  /**
   * 克隆当前对象（深拷贝）
   */
  clone(): ReminderTemplateGroup {
    return ReminderTemplateGroup.fromDTO(this.toDTO());
  }

  // ===== Getters =====

  get uuid(): string {
    return this._uuid;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get enableMode(): ReminderContracts.ReminderTemplateEnableMode {
    return this._enableMode;
  }

  get parentUuid(): string | undefined {
    return this._parentUuid;
  }

  get icon(): string | undefined {
    return this._icon;
  }

  get color(): string | undefined {
    return this._color;
  }

  get sortOrder(): number {
    return this._sortOrder;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
