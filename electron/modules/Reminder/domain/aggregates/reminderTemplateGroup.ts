import { ReminderTemplate } from "./reminderTemplate";
import { AggregateRoot } from "@/shared/domain/aggregateRoot";
import type { IReminderTemplateGroup, ReminderTemplateEnableMode } from "@common/modules/reminder";

export class ReminderTemplateGroup extends AggregateRoot implements IReminderTemplateGroup {

  private _name: string;
  private _enabled: boolean;
  private _templates: ReminderTemplate[] = [];
  private _enableMode: ReminderTemplateEnableMode = "group"; // 新增属性

  constructor(
    uuid: string,
    name: string,
    enabled = true,
    templates: ReminderTemplate[] = [],
    enableMode: ReminderTemplateEnableMode = "group"
  ) {
    super(uuid || ReminderTemplateGroup.generateId());
    this._name = name;
    this._enabled = enabled;
    this._templates = templates;
    this._enableMode = enableMode;
  }

  get id() { return this._uuid; }
  get name() { return this._name; }
  set name(val: string) { this._name = val; }
  get enabled() { return this._enabled; }
  set enabled(val: boolean) { this._enabled = val; }
  get enableMode() { return this._enableMode; }
  set enableMode(val: ReminderTemplateEnableMode) { this._enableMode = val; }
  get templates() { return this._templates; }

  /**
   * 判断某个模板是否实际启用
   */
  isTemplateEnabled(template: ReminderTemplate) {
    // 将 enableMode 映射到 template 期望的类型
    const mode = this._enableMode === "individual" ? "individual" : "group";
    return template.getCalculatedEnabled(this._enabled, mode);
  }

  /**
   * 获取分组内所有“实际启用”的模板
   */
  get enabledTemplates() {
    const mode = this._enableMode === "individual" ? "individual" : "group";
    return this._templates.filter(template => 
      template.getCalculatedEnabled(this._enabled, mode)
    );
  }

  /**
   * 添加模板到分组
   */
  addTemplate(template: ReminderTemplate) {
    if (!this._templates.find(t => t.uuid === template.uuid)) {
      this._templates.push(template);
      // 计算并设置模板的启用状态
      const mode = this._enableMode === "individual" ? "individual" : "group";
      template.calculateAndSetEnabled(this._enabled, mode);
    }
  }

  /**
   * 从分组移除模板
   */
  removeTemplate(templateId: string) {
    this._templates = this._templates.filter(t => t.uuid !== templateId);
  }

  /**
   * 设置组的启用状态，并更新所有模板的启用状态
   */
  setEnabled(enabled: boolean) {
    this._enabled = enabled;
    this.updateAllTemplatesEnabled();
  }

  /**
   * 设置组的控制模式，并更新所有模板的启用状态
   */
  setEnableMode(mode: ReminderTemplateEnableMode) {
    this._enableMode = mode;
    this.updateAllTemplatesEnabled();
  }

  /**
   * 更新组内所有模板的启用状态
   */
  private updateAllTemplatesEnabled() {
    const mode = this._enableMode === "individual" ? "individual" : "group";
    this._templates.forEach(template => {
      template.calculateAndSetEnabled(this._enabled, mode);
    });
  }

  /**
   * 判断组是否有启用的模板
   */
  get hasEnabledTemplate() {
    return this._templates.some(t => t.enabled);
  }

  static isReminderTemplateGroup(obj: any): obj is ReminderTemplateGroup {
    return obj instanceof ReminderTemplateGroup || (obj && obj.uuid && obj.name && Array.isArray(obj.templates));
  }

  /**
   * 分组DTO导出
   */
  toDTO() {
    return {
      uuid: this._uuid,
      name: this._name,
      enabled: this._enabled,
      templates: this._templates.map(t => t.toDTO()),
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
      (dto.templates || []).map((t: any) => ReminderTemplate.fromDTO(t)),
      dto.enableMode || "group" // 确保enableMode有默认值
    );
  }

  static ensureReminderTemplateGroup(obj: any): ReminderTemplateGroup {
    if (ReminderTemplateGroup.isReminderTemplateGroup(obj)) {
      return obj;
    } else {
      return ReminderTemplateGroup.fromDTO(obj);
    }
  }
}