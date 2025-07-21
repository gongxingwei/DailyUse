import { ReminderTemplate } from "./reminderTemplate";
import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import type { IReminderTemplateGroup } from "@common/modules/reminder";
import type { ReminderTemplateEnableMode } from "@common/modules/reminder";

/**
 * 渲染进程的 ReminderTemplateGroup 聚合根
 */
export class ReminderTemplateGroup
  extends AggregateRoot
  implements IReminderTemplateGroup
{
  private _name: string;
  private _enabled: boolean;
  private _templates: ReminderTemplate[] = [];
  private _enableMode: ReminderTemplateEnableMode = "group"; // 新增属性

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

  get id() {
    return this._uuid;
  }
  get name() {
    return this._name;
  }
  set name(val: string) {
    this._name = val;
  }
  get enabled() {
    return this._enabled;
  }
  set enabled(val: boolean) {
    this._enabled = val;
  }
  get enableMode() {
    return this._enableMode;
  }
  set enableMode(val: ReminderTemplateEnableMode) {
    this._enableMode = val;
  }
  get templates() {
    return this._templates;
  }

  /**
   * 判断某个模板是否实际启用
   */
  isTemplateEnabled(template: ReminderTemplate) {
    if (this._enableMode === "group") {
      return this._enabled;
    }
    return template.enabled;
  }

  /**
   * 获取分组内所有“实际启用”的模板
   */
  get enabledTemplates() {
    if (this._enableMode === "group") {
      return this._enabled ? this._templates : [];
    }
    return this._templates.filter((t) => t.enabled);
  }

  /**
   * 添加模板到分组
   */
  addTemplate(template: ReminderTemplate) {
    if (!this._templates.find((t) => t.uuid === template.uuid)) {
      this._templates.push(template);
      // 跟随组的启用状态
      template["_enabled"] = this._enabled;
    }
  }

  /**
   * 从分组移除模板
   */
  removeTemplate(templateId: string) {
    this._templates = this._templates.filter((t) => t.uuid !== templateId);
  }

  /**
   * 批量设置组内所有模板的启用状态
   */
  setAllTemplatesEnabled(enabled: boolean) {
    this._templates.forEach((tpl) => (tpl["_enabled"] = enabled));
  }

  /**
   * 判断组是否有启用的模板
   */
  get hasEnabledTemplate() {
    return this._templates.some((t) => t.enabled);
  }

  static isReminderTemplateGroup(obj: any): obj is ReminderTemplateGroup {
    return (
      obj instanceof ReminderTemplateGroup ||
      (obj && obj.uuid && obj.name && Array.isArray(obj.templates))
    );
  }

  /**
   * 分组DTO导出
   */
  toDTO() {
    return {
      uuid: this._uuid,
      name: this._name,
      enabled: this._enabled,
      templates: this._templates.map((t) => t.toDTO()),
      enableMode: this._enableMode, // 确保包含此字段
    };
  }

  /**
   * 分组DTO导入
   */
  static fromDTO(dto: any) {
    return new ReminderTemplateGroup(
      dto.uuid,
      dto.name,
      dto.enabled,
      dto.enableMode || "group", // 确保enableMode有默认值
      (dto.templates || []).map((t: any) => ReminderTemplate.fromDTO(t))
    );
  }

  static ensureReminderTemplateGroup(obj: any): ReminderTemplateGroup | null {
  if (obj instanceof ReminderTemplateGroup) {
    return obj;
  }
  if (obj && obj.uuid && obj.name && Array.isArray(obj.templates)) {
    return ReminderTemplateGroup.fromDTO(obj);
  }
  return null;
}

  clone(): ReminderTemplateGroup {
    return new ReminderTemplateGroup(
      this._name,
      this._enabled,
      this._templates.map((t) => t.clone()),
      this._enableMode,
      this._uuid
    );
  }

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
