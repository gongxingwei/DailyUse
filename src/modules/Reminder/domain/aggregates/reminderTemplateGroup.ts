import { ReminderTemplate } from "../entities/reminderTemplate";
import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import type { IReminderTemplateGroup, ReminderTemplateEnableMode } from "@common/modules/reminder";
import { SYSTEM_GROUP_ID } from "@common/modules/reminder/types/reminder";

/**
 * ReminderTemplateGroup 聚合根
 * 管理提醒模板分组及其模板集合
 */
export class ReminderTemplateGroup extends AggregateRoot implements IReminderTemplateGroup {
  // ========== 私有属性 ==========
  private _name: string;
  private _enabled: boolean;
  private _templates: ReminderTemplate[] = [];
  private _enableMode: ReminderTemplateEnableMode = "group";

  // ========== 构造函数 ==========
  /**
   * 构造 ReminderTemplateGroup
   * @param name 分组名称
   * @param enabled 分组启用状态
   * @param templates 模板数组
   * @param enableMode 启用模式
   * @param uuid 分组唯一ID
   */
  constructor(
    name: string,
    enabled = true,
    templates: ReminderTemplate[] = [],
    enableMode: ReminderTemplateEnableMode = "group",
    uuid?: string,
  ) {
    super(uuid || ReminderTemplateGroup.generateId());
    this._name = name;
    this._enabled = enabled;
    this._templates = templates;
    this._enableMode = enableMode;
  }

  // ========== Getter/Setter ==========
  get uuid() { return this._uuid; }
  get name() { return this._name; }
  set name(val: string) { this._name = val; }
  get enabled() { return this._enabled; }
  set enabled(val: boolean) { this._enabled = val; }
  get enableMode() { return this._enableMode; }
  set enableMode(val: ReminderTemplateEnableMode) { this._enableMode = val; }
  get templates() { return this._templates; }

  // ========== 实例方法 ==========

  isTemplateEnabled(templateUuid: string): boolean {
    if (this._uuid === SYSTEM_GROUP_ID) {
      const template = this._templates.find((t) => t.uuid === templateUuid);
      return template ? template.selfEnabled : false;
    }
    if (this._enableMode === "group") return this._enabled;
    const template = this._templates.find((t) => t.uuid === templateUuid);
    return template ? template.selfEnabled : false;
  }

  /**
   * 添加模板到分组（去重）
   * @param template 模板实例
   */
  addTemplate(template: ReminderTemplate) {
    if (!this._templates.find((t) => t.uuid === template.uuid)) {
      this._templates.push(template);
    }
  }

  /**
   * 从分组移除模板
   * @param templateId 模板ID
   */
  removeTemplate(templateId: string) {
    this._templates = this._templates.filter((t) => t.uuid !== templateId);
  }

  /**
   * 克隆当前分组实例（深拷贝模板）
   */
  clone(): ReminderTemplateGroup {
    return new ReminderTemplateGroup(
      this._name,
      this._enabled,
      this._templates.map((t) => t.clone()),
      this._enableMode,
      this._uuid
    );
  }

  /**
   * 导出为 DTO 对象（用于持久化/传输）
   */
  toDTO() {
    return {
      uuid: this._uuid,
      name: this._name,
      enabled: this._enabled,
      templates: this._templates.map((t) => t.toDTO()),
      enableMode: this._enableMode,
    };
  }

  // ========== 静态方法 ==========

  /**
   * 从 DTO 创建分组实例
   * @param dto DTO对象
   */
  static fromDTO(dto: any) {
    return new ReminderTemplateGroup(
      dto.name,
      dto.enabled,
      (dto.templates || []).map((t: any) => ReminderTemplate.fromDTO(t)),
      dto.enableMode || "group",
      dto.uuid,
    );
  }

  /**
   * 类型守卫：判断对象是否为 ReminderTemplateGroup
   * @param obj 任意对象
   */
  static isReminderTemplateGroup(obj: any): obj is ReminderTemplateGroup {
    return (
      obj instanceof ReminderTemplateGroup ||
      (obj && obj.uuid && obj.name && Array.isArray(obj.templates))
    );
  }

  /**
   * 保证返回 ReminderTemplateGroup 实例或 null
   * @param obj 任意对象
   */
  static ensureReminderTemplateGroup(obj: any): ReminderTemplateGroup | null {
    if (obj instanceof ReminderTemplateGroup) return obj;
    if (obj && obj.uuid && obj.name && Array.isArray(obj.templates)) {
      return ReminderTemplateGroup.fromDTO(obj);
    }
    return null;
  }

    /**
   * 保证返回 ReminderTemplateGroup 实例或空对象
   * @param obj 任意对象
   */
  static ensureReminderTemplateGroupNeverNull(obj: any): ReminderTemplateGroup {
    if (obj instanceof ReminderTemplateGroup) return obj;
    if (obj && obj.uuid && obj.name && Array.isArray(obj.templates)) {
      return ReminderTemplateGroup.fromDTO(obj);
    }
    return {} as ReminderTemplateGroup;
  }

  /**
   * 创建一个用于新建的默认分组实例
   */
  static forCreate(): ReminderTemplateGroup {
    return new ReminderTemplateGroup(
      '',
      true,
      [],
      'group',
      undefined
    );
  }
}
