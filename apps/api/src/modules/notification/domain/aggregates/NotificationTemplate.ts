import { NotificationType, NotificationPriority, NotificationChannel } from '@dailyuse/contracts';
import { NotificationAction } from '../value-objects/NotificationAction';

/**
 * NotificationTemplate 聚合根
 *
 * 职责：
 * - 管理可复用的通知模板
 * - 提供模板渲染功能
 * - 验证模板变量
 * - 管理模板启用/禁用状态
 */
export class NotificationTemplate {
  private constructor(
    private _uuid: string,
    private _name: string,
    private _type: NotificationType,
    private _titleTemplate: string,
    private _contentTemplate: string,
    private _defaultPriority: NotificationPriority,
    private _defaultChannels: NotificationChannel[],
    private _variables: string[],
    private _icon?: string,
    private _defaultActions?: NotificationAction[],
    private _enabled: boolean = true,
    private _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this._uuid || this._uuid.trim().length === 0) {
      throw new Error('Template uuid cannot be empty');
    }

    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Template name cannot be empty');
    }

    if (!this._titleTemplate || this._titleTemplate.trim().length === 0) {
      throw new Error('Title template cannot be empty');
    }

    if (!this._contentTemplate || this._contentTemplate.trim().length === 0) {
      throw new Error('Content template cannot be empty');
    }

    if (this._defaultChannels.length === 0) {
      throw new Error('At least one default channel is required');
    }

    // 验证模板变量格式
    const templateVarPattern = /\{\{(\w+)\}\}/g;
    const titleVars = [...this._titleTemplate.matchAll(templateVarPattern)].map((m) => m[1]);
    const contentVars = [...this._contentTemplate.matchAll(templateVarPattern)].map((m) => m[1]);
    const allTemplateVars = new Set([...titleVars, ...contentVars]);

    // 检查声明的变量是否都在模板中使用
    const unusedVars = this._variables.filter((v) => !allTemplateVars.has(v));
    if (unusedVars.length > 0) {
      console.warn(`Template ${this._name} has unused variables: ${unusedVars.join(', ')}`);
    }
  }

  // ========== Getters ==========

  get uuid(): string {
    return this._uuid;
  }

  get name(): string {
    return this._name;
  }

  get type(): NotificationType {
    return this._type;
  }

  get titleTemplate(): string {
    return this._titleTemplate;
  }

  get contentTemplate(): string {
    return this._contentTemplate;
  }

  get defaultPriority(): NotificationPriority {
    return this._defaultPriority;
  }

  get defaultChannels(): NotificationChannel[] {
    return [...this._defaultChannels];
  }

  get variables(): string[] {
    return [...this._variables];
  }

  get icon(): string | undefined {
    return this._icon;
  }

  get defaultActions(): NotificationAction[] | undefined {
    return this._defaultActions;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ========== 静态工厂方法 ==========

  static create(params: {
    uuid: string;
    name: string;
    type: NotificationType;
    titleTemplate: string;
    contentTemplate: string;
    defaultPriority: NotificationPriority;
    defaultChannels: NotificationChannel[];
    variables: string[];
    icon?: string;
    defaultActions?: NotificationAction[];
    enabled?: boolean;
  }): NotificationTemplate {
    return new NotificationTemplate(
      params.uuid,
      params.name,
      params.type,
      params.titleTemplate,
      params.contentTemplate,
      params.defaultPriority,
      params.defaultChannels,
      params.variables,
      params.icon,
      params.defaultActions,
      params.enabled ?? true,
    );
  }

  static fromPersistence(data: {
    uuid: string;
    name: string;
    type: NotificationType;
    titleTemplate: string;
    contentTemplate: string;
    defaultPriority: NotificationPriority;
    defaultChannels: NotificationChannel[];
    variables: string[];
    icon?: string;
    defaultActions?: NotificationAction[];
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): NotificationTemplate {
    return new NotificationTemplate(
      data.uuid,
      data.name,
      data.type,
      data.titleTemplate,
      data.contentTemplate,
      data.defaultPriority,
      data.defaultChannels,
      data.variables,
      data.icon,
      data.defaultActions,
      data.enabled,
      data.createdAt,
      data.updatedAt,
    );
  }

  // ========== 业务方法 ==========

  /**
   * 渲染模板
   */
  render(variables: Record<string, any>): { title: string; content: string } {
    if (!this._enabled) {
      throw new Error('Cannot render disabled template');
    }

    // 检查必需变量
    const missingVars = this._variables.filter((v) => !(v in variables));
    if (missingVars.length > 0) {
      throw new Error(`Missing required variables: ${missingVars.join(', ')}`);
    }

    let title = this._titleTemplate;
    let content = this._contentTemplate;

    // 替换变量
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      const replacement = String(value ?? '');
      title = title.replace(new RegExp(placeholder, 'g'), replacement);
      content = content.replace(new RegExp(placeholder, 'g'), replacement);
    });

    return { title, content };
  }

  /**
   * 验证变量值
   */
  validateVariables(variables: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查必需变量
    this._variables.forEach((varName) => {
      if (!(varName in variables)) {
        errors.push(`Missing required variable: ${varName}`);
      } else if (variables[varName] === null || variables[varName] === undefined) {
        errors.push(`Variable ${varName} cannot be null or undefined`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 更新模板
   */
  update(params: {
    name?: string;
    titleTemplate?: string;
    contentTemplate?: string;
    defaultPriority?: NotificationPriority;
    defaultChannels?: NotificationChannel[];
    variables?: string[];
    icon?: string;
    defaultActions?: NotificationAction[];
  }): void {
    if (params.name !== undefined) this._name = params.name;
    if (params.titleTemplate !== undefined) this._titleTemplate = params.titleTemplate;
    if (params.contentTemplate !== undefined) this._contentTemplate = params.contentTemplate;
    if (params.defaultPriority !== undefined) this._defaultPriority = params.defaultPriority;
    if (params.defaultChannels !== undefined) this._defaultChannels = params.defaultChannels;
    if (params.variables !== undefined) this._variables = params.variables;
    if (params.icon !== undefined) this._icon = params.icon;
    if (params.defaultActions !== undefined) this._defaultActions = params.defaultActions;

    this._updatedAt = new Date();
    this.validate();
  }

  /**
   * 启用模板
   */
  enable(): void {
    this._enabled = true;
    this._updatedAt = new Date();
  }

  /**
   * 禁用模板
   */
  disable(): void {
    this._enabled = false;
    this._updatedAt = new Date();
  }

  /**
   * 转换为普通对象
   */
  toPlainObject() {
    return {
      uuid: this._uuid,
      name: this._name,
      type: this._type,
      titleTemplate: this._titleTemplate,
      contentTemplate: this._contentTemplate,
      defaultPriority: this._defaultPriority,
      defaultChannels: this._defaultChannels,
      variables: this._variables,
      icon: this._icon,
      defaultActions: this._defaultActions?.map((a) => a.toPlainObject()),
      enabled: this._enabled,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
